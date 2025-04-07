import sys
import logging
import os
import json
import threading
from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from pyzkfp import ZKFP2
from threading import Thread, Lock
from time import sleep
from pymongo import MongoClient, ReturnDocument
from bson import ObjectId  # Ensures MongoDB ObjectId handling
from datetime import datetime
import base64

sys.dont_write_bytecode = True

# MongoDB Configuration
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "fingerprintDB"
COLLECTION_NAME = "fingerprints"
COLLECTION_CONTACT = "contacts"
COLLECTION_COUNTERS = "counters"

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
fingerprint_collection = db[COLLECTION_NAME]
contact_collection = db[COLLECTION_CONTACT]

# Flask Setup
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Logging Setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('FingerprintAPI')

# Fingerprint SDK Variables
zkfp2 = ZKFP2()
scanner_lock = Lock()
scanner_initialized = False
keep_alive = False
register_mode = False
current_fid = None
current_user = None
capture = None
loaded_templates = False

# Temporary storage for scanned fingerprints
user_templates = {}



def load_templates():
    """Load fingerprint templates from MongoDB only on first initialization."""
    global loaded_templates
    if loaded_templates:
        return
    zkfp2.DBInit()
    fingerprints = fingerprint_collection.find({})
    for record in fingerprints:
        fid = record["biometricId"]
        templates = record["templates"]
        try:
            reg_temp, _ = zkfp2.DBMerge(*[bytes.fromhex(t) for t in templates])
            zkfp2.DBAdd(fid, reg_temp)
            # zkfp2.DBDel(fid, reg_temp)

        except Exception as e:
            logger.error(f"Error loading fingerprint {fid}: {e}")
    loaded_templates = True


def capture_handler():
    """Handles fingerprint capture and identification."""
    global capture, register_mode, current_fid, current_user

    if not capture:
        return

    try:
        tmp, img = capture
        tmp_bytes = bytes(tmp)
        img_bytes = bytes(img)  # Convert image to bytes


        with scanner_lock:
            fid, score = zkfp2.DBIdentify(tmp_bytes)
            # logger.info(f"🟢 Scan captured for User {current_fid} (Identified: {fid}) {score}")

        socketio.emit("fingerprint_image", {"image": img_bytes.hex()}, namespace='/')


        if register_mode:
            # Ensure user ID is an ObjectId or convert it to a string
            if fid != -1 and score > 0:
                zkfp2.Light('red')
                logger.info(f"🟢 Scan for User already exist {current_fid} (Identified: {fid}) {score}")
                socketio.emit("fingerprint_verified", {"user_id": fid, "score": score}, namespace='/')
                return
            
            
            user_id_str = str(current_fid)  # Generate a new ObjectId if needed

            if user_id_str not in user_templates:
                user_templates[user_id_str] = []

            templates = user_templates[user_id_str]

            # Ensure fingerprint is different from the last saved one
            if not templates or zkfp2.DBMatch(bytes.fromhex(templates[-1]), tmp_bytes) > 0:
                zkfp2.Light('green')
                templates.append(tmp_bytes.hex())
                logger.info(f"🟢 Scan {len(templates)}/3 captured for User {user_id_str}")

                socketio.emit("fingerprint_scan", {"user_id": user_id_str, "step": len(templates)}, namespace='/')

                if len(templates) == 3:
                    # Convert hex templates to byte arrays for DB merging
                    reg_temp, _ = zkfp2.DBMerge(*[bytes.fromhex(t) for t in templates])

                    # Convert user_id to an integer for DBAdd (hash user_id if necessary)
                    user_id_int = int(current_fid)  # Convert first 8 hex chars to int

                    logger.info(f"✅ User {user_id_str} enrolled {reg_temp} successfully. {user_id_int} {templates}")
                    # Add to local fingerprint database
                    zkfp2.DBAdd(user_id_int, reg_temp)
                    logger.info(f"✅ User {user_id_str} enrolled successfully. {user_id_int}")

                    # Save to MongoDB
                    fingerprint = fingerprint_collection.insert_one({
                        "user_id": current_user,
                        "biometricId": user_id_int,
                        "templates": templates,
                        "enrolled_at": datetime.now()
                    })
                    
                    # logger.info(f"❌ new Finger {fingerprint}")
                    fingerprint_id = fingerprint.inserted_id  # ✅ Correct way to get _id

                                
                    contact_collection.update_one(
                        {"_id": ObjectId(current_user)},
                        {"$set": {"biometric":  fingerprint_id}},
                        upsert=True
                    )
                    zkfp2.Light('green', 3)
                    socketio.emit("fingerprint_enrolled", {"user_id": current_user, "biometricId": user_id_int, "image": img_bytes.hex()}, namespace='/')

                    # Cleanup
                    del user_templates[user_id_str]
                    register_mode = False
                
                if len(templates) > 3:
                    del user_templates[user_id_str]
                    register_mode = False
                
            else:
                zkfp2.Light('red', 1)
                logger.warning("❌ Different finger detected!")

        else:
            if fid != -1 and score > 0:
                logger.info(f"✅ Identified user: {fid}, Score: {score}")
                zkfp2.Light('green')
                socketio.emit("fingerprint_verified", {"user_id": fid, "score": score}, namespace='/')
            else:
                logger.warning("❌ Fingerprint not recognized.")
                zkfp2.Light('red')
                socketio.emit("fingerprint_not_verified", {"message": "User not found"}, namespace='/')

    except Exception as e:
        logger.error(f"❌ Error in capture_handler: {e}")

    finally:
        capture = None
        
        

def initialize_scanner():
    """Initialize the fingerprint scanner SDK safely."""
    global keep_alive, scanner_initialized, current_fid
    if scanner_initialized:
        logger.warning("⚠️ Scanner already initialized.")
        return True

    with scanner_lock:
        logger.info("🟡 Initializing fingerprint scanner SDK...")

        try:
            if zkfp2.Init() is not None:
                logger.error("❌ SDK initialization failed.")
                socketio.emit("scanner_status", {"message": "Initialize Failed", "status": "failed"})
                return False

            device_count = zkfp2.GetDeviceCount()
            if device_count == 0:
                logger.error("❌ No fingerprint scanner detected.")
                zkfp2.Terminate()
                return False

            zkfp2.OpenDevice(0)
            zkfp2.Light("green")
            zkfp2.Light('white')

            logger.info("🟢 Fingerprint scanner initialized successfully.")

            scanner_initialized = True
            keep_alive = True
            load_templates()

            Thread(target=listen_to_fingerprints, daemon=True).start()
            socketio.emit("scanner_status", {"message": "Initialized Success", "status": "initialized"})
            return True

        except Exception as e:
            logger.error(f"❌ Exception initializing scanner: {e}")
            return False


stop_light_thread = threading.Event()

def shutdown_scanner():
    """Safely shuts down the fingerprint scanner."""
    global keep_alive, scanner_initialized, current_fid

    with scanner_lock:
        if not scanner_initialized:
            logger.warning("⚠️ Scanner already shut down.")
            return jsonify({"message": "Scanner was not running."}), 200

        logger.info("🟠 Shutting down fingerprint scanner...")

        try:
            # Signal light_thread to stop
            stop_light_thread.set()
            
            # Stop background processing before shutting down
            keep_alive = False
            current_fid = None

            # Wait for background threads to exit
            sleep(1)  

            # Check active threads before shutdown
            active_threads = threading.enumerate()
            logger.info(f"🧐 Active threads before shutdown: {[t.name for t in active_threads]}")

            # Close scanner device and terminate SDK
            zkfp2.CloseDevice()
            zkfp2.Terminate()
            scanner_initialized = False

            logger.info("🔴 Fingerprint scanner shut down successfully.")
            socketio.emit("server_response", {"message": "Shutdown"})
            return jsonify({"message": "Scanner shut down."}), 200

        except Exception as e:
            logger.error(f"❌ Error shutting down scanner: {e}")

            return jsonify({"error": "Failed to shut down scanner."}), 500
 
 
def delete_fingerprint(finger_id):
    """Deletes a fingerprint by biometric ID from the scanner and MongoDB."""
    global scanner_initialized

    if not scanner_initialized:
        logger.warning("⚠️ Scanner is not initialized.")
        return jsonify({"error": "Scanner is not initialized."}), 400

    try:
        with scanner_lock:
            # Delete from scanner database
            zkfp2.DBDel(finger_id)
            logger.info(f"🗑️ Deleted fingerprint {finger_id} from scanner database.")
            
            # Delete from MongoDB
            result = fingerprint_collection.delete_one({"biometricId": finger_id})
            
            if result.deleted_count > 0:
                logger.info(f"🗑️ Deleted fingerprint {finger_id} from MongoDB.")
                return jsonify({"message": "Fingerprint deleted successfully."}), 200
            else:
                logger.warning(f"⚠️ Fingerprint {finger_id} not found in MongoDB.")
                return jsonify({"error": "Fingerprint not found."}), 404
    
    except Exception as e:
        logger.error(f"❌ Error deleting fingerprint: {e}")
        return jsonify({"error": "Failed to delete fingerprint."}), 500
 
 

@app.route('/init', methods=['POST'])
def api_initialize_scanner():
    """API endpoint to initialize the scanner."""
    if initialize_scanner():
        zkfp2.Light('red', 3)
        zkfp2.Light('green', 3)
        
        if not socketio.server:  
            Thread(target=socketio.run, args=(app,), kwargs={"host": "0.0.0.0", "port": 5000, "allow_unsafe_werkzeug": True, "use_reloader": False}, daemon=True).start()
        
        return jsonify({"message": "Scanner initialized successfully."}), 200
    return jsonify({"error": "Failed to initialize scanner."}), 500




@app.route('/shutdown', methods=['POST'])
def api_shutdown_scanner():
    """API endpoint to shut down the scanner."""
    return shutdown_scanner()




def listen_to_fingerprints():
    """Continuously listen for fingerprint scans."""
    global capture, keep_alive
    try:
        while keep_alive:
            with scanner_lock:
                capture = zkfp2.AcquireFingerprint()
            if capture:
                Thread(target=capture_handler, daemon=True).start()
            sleep(0.1)
    except KeyboardInterrupt:
        shutdown_scanner()


# @app.route('/enroll', methods=['POST'])
@socketio.on("enroll") 
def socket_enroll_fingerprint(data):
    """API endpoint to enroll a new fingerprint with a specific user ID."""
    global register_mode, current_fid, current_user
    if not scanner_initialized:
        # return jsonify({"error": "Device not initialized."}), 400
        emit("enrollment_error", {"message": "Device not initialized."})

    initialize_scanner() 
     
    if register_mode:
        zkfp2.Light('red')
        # return jsonify({"error": "Enrollment already in progress."}), 400
        emit("enrollment_error", {"message": "Enrollment already in progress."})

    # data = request.get_json()
    user_id = data.get("user_id")  # Get user_id from request body
    finger_id = data.get("fingerPrintId")  # Get user_id from request body
    
    
    logger.info(f"🖥️ Frontend connected to WebSocket.{user_id}")


    if user_id is None:
        emit("enrollment_error", {"error": "User ID is required"})

        # return jsonify({"error": "User ID is required!. Choose a different ID."}), 400

    current_fid = finger_id  # Default to the next available ID
    current_user = user_id
    # Check if user already exists in MongoDB
    existing_user = fingerprint_collection.find_one({"user_id": current_user})
    if existing_user:
        zkfp2.Light('red', 3)
        emit("enrollment_error", {"error": "User ID already exists. Choose a different ID."})
    
    existing_user = fingerprint_collection.find_one({"biometricId": current_fid})
    if existing_user:
        zkfp2.Light('red', 3)
        emit("enrollment_error", {"error": "User ID already exists. Choose a different ID."})
        # return jsonify({"error": "User ID already exists. Choose a different ID."}), 400
    else:
        register_mode = True
        
        zkfp2.Light('green', 3)
        # return jsonify({
        #     "message": "Place the same finger three times to enroll.",
        #     "user_id": user_id
        # }), 200
        emit("enrollment_started", {"user_id": user_id, "message": "Place the same finger three times to enroll."})


@app.route('/match_fingerprint', methods=['POST'])
def match_fingerprint():
    """API endpoint to match a fingerprint using a fingerprint image."""
    if not scanner_initialized:
        return jsonify({"error": "Device not initialized."}), 400

    try:
        data = request.get_json()

        # Pretty-print incoming JSON request
        logger.info(f"📥 Received request: {json.dumps(data, indent=4)}")

        fingerprint_image_base64 = data.get("fingerprint_image")
        logger.info(f"📥 Received request: {fingerprint_image_base64}")
        if not fingerprint_image_base64:
            return jsonify({"error": "Fingerprint image is required."}), 400

        # Validate Base64 string before processing
        try:
            fingerprint_bytes = base64.b64decode(fingerprint_image_base64)
        except base64.binascii.Error:
            return jsonify({"error": "Invalid Base64 fingerprint data."}), 400

        with scanner_lock:
            fid, score = zkfp2.DBIdentify(fingerprint_bytes)

        if fid != -1 and score > 0:
            logger.info(f"✅ Identified user: {fid}, Score: {score}")
            return jsonify({"user_id": fid, "score": score}), 200
        else:
            logger.warning("❌ Fingerprint not recognized.")
            return jsonify({"error": "Fingerprint not recognized."}), 404

    except Exception as e:
        logger.error(f"❌ Error in match_fingerprint: {e}")
        return jsonify({"error": "Failed to match fingerprint."}), 500


@socketio.on("connect")
def handle_connect():
    """Handle WebSocket connection."""
    logger.info("🖥️ Frontend connected to WebSocket.")
    emit("status_response", {"message": "Socket Started!"})
    emit("server_response", {"message": "Connected"})

@socketio.on("init")
def socket_initialize_scanner():
    """INIT WebSocket connection."""
    if initialize_scanner():
        emit("scanner_status", {"message": "Initialize", "status": "initialize"})
        logger.info("🖥️ Frontend connected to WebSocket.")
        zkfp2.Light('red', 3)
        zkfp2.Light('green', 3)
        
        if not socketio.server:  
                Thread(target=socketio.run, args=(app,), kwargs={"host": "0.0.0.0", "port": 5000, "allow_unsafe_werkzeug": True, "use_reloader": False}, daemon=True).start()
        emit("server_response", {"message": "Done Initialize"})


@socketio.on("shutdown")
def socket_shutdown_scanner():
    """Shutdown WebSocket connection."""
    shutdown_scanner()
    logger.info("🖥️ Scanner Shutdown!.")
    emit("server_response", {"message": "Shutdown"})
    # socketio.stop()  # Gracefully stops the WebSocket server

@socketio.on("stop_enroll")
def socket_stop_enroll():
    """Enrollment Stop."""
    global register_mode

    register_mode = False
    logger.info("🖥️ Enrollment Stopped.")
    emit("status_response", {"message": "Enrollment Stop!"})



@socketio.on("check_status")
def socket_status():
    """INIT WebSocket connection."""
    logger.info("🖥️ Socket Status.")
    if scanner_initialized:
        emit("check_status_response", {"message": "Scanner initialized", "connected": True})
    else:
        emit("check_status_response", {"message": "Scanner not initialized", "connected": False})

def delete_fingerprint(finger_id):
    """Deletes a fingerprint by biometric ID from the scanner and MongoDB."""
    global scanner_initialized

    if not scanner_initialized:
        logger.warning("⚠️ Scanner is not initialized.")
        return jsonify({"error": "Scanner is not initialized."}), 400

    try:
        with scanner_lock:
            # Delete from scanner database
            zkfp2.DBDel(finger_id)
            logger.info(f"🗑️ Deleted fingerprint {finger_id} from scanner database.")
            
            # Delete from MongoDB
            result = fingerprint_collection.delete_one({"biometricId": finger_id})
            
            if result.deleted_count > 0:
                logger.info(f"🗑️ Deleted fingerprint {finger_id} from MongoDB.")
                return jsonify({"message": "Fingerprint deleted successfully."}), 200
            else:
                logger.warning(f"⚠️ Fingerprint {finger_id} not found in MongoDB.")
                return jsonify({"error": "Fingerprint not found."}), 404
    
    except Exception as e:
        logger.error(f"❌ Error deleting fingerprint: {e}")
        return jsonify({"error": "Failed to delete fingerprint."}), 500



@socketio.on("delete_fingerprint")
def socket_delete_fingerprint(data):
    """WebSocket event to delete a fingerprint."""
    finger_id = data.get("fingerPrintId")
        
    if finger_id is None:
        emit("delete_error", {"error": "Fingerprint ID is required."})
        return
    
    response, status_code = delete_fingerprint(finger_id)
    if status_code == 200:
        emit("fingerprint_deleted", {"message": "Fingerprint deleted successfully."})
    else:
        emit("delete_error", {"error": "Failed to delete fingerprint."})



if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)

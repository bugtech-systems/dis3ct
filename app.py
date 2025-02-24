import sys
import logging
import os
import json
from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from pyzkfp import ZKFP2
from threading import Thread, Lock
from time import sleep
from pymongo import MongoClient
from bson import ObjectId  # Ensures MongoDB ObjectId handling
from datetime import datetime

sys.dont_write_bytecode = True

# MongoDB Configuration
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "fingerprintDB"
COLLECTION_NAME = "fingerprints"
COLLECTION_CONTACT = "contacts"

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
current_fid = 1
capture = None

# Temporary storage for scanned fingerprints
user_templates = {}

def load_templates():
    """Load fingerprint templates from MongoDB into memory."""
    global current_fid

    zkfp2.DBInit()
    fingerprints = fingerprint_collection.find({})

    for record in fingerprints:
        fid = record["user_id"]
        templates = record["templates"]

        if len(templates) < 3:
            logger.warning(f"⚠️ Skipping user {fid}, insufficient templates.")
            continue

        try:
            reg_temp, _ = zkfp2.DBMerge(*[bytes.fromhex(t) for t in templates])
            
            
            logger.info(f"📥 Loaded fingerprint for user {fid} {reg_temp}")

            zkfp2.DBAdd(fid, reg_temp)
            logger.info(f"📥 Loaded fingerprint for user {fid}")

        except Exception as e:
            logger.error(f"❌ Error loading fingerprint {fid}: {e}")

    # Update the current_fid based on the highest stored user ID
    # last_user = fingerprint_collection.find_one(sort=[("enrolledAt", -1)])
    # if last_user:
    #     current_fid = last_user["user_id"]._id


def save_templates(user_id, fingerprint_list):
    """Save fingerprint templates to MongoDB."""
    fingerprint_collection.update_one(
        {"user_id": user_id},
        {"$set": {"templates": fingerprint_list}},
        upsert=True
    )
    logger.info(f"💾 Fingerprint templates for User {user_id} saved to MongoDB.")



def capture_handler():
    """Handles fingerprint capture and identification."""
    global capture, register_mode, current_fid

    if not capture:
        return

    try:
        tmp, img = capture
        tmp_bytes = bytes(tmp)

        with scanner_lock:
            fid, score = zkfp2.DBIdentify(tmp_bytes)
            logger.info(f"🟢 Scan captured for User {current_fid} (Identified: {fid}) {score}")

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
                    user_id_int = int(user_id_str[:8], 16)  # Convert first 8 hex chars to int

                    logger.info(f"✅ User {user_id_str} enrolled {reg_temp} successfully. {user_id_int} {templates}")
                    # Add to local fingerprint database
                    zkfp2.DBAdd(user_id_int, reg_temp)
                    logger.info(f"✅ User {user_id_str} enrolled successfully. {user_id_int}")

                    # Save to MongoDB
                    fingerprint_collection.insert_one({
                        "_id": ObjectId(user_id_str),  # Store as ObjectId
                        "user_id": user_id_int,
                        "templates": templates,
                        "enrolled_at": datetime.now()
                    })
                                
                    contact_collection.update_one(
                        {"_id": ObjectId(user_id_str)},
                        {"$set": {"biometric":  ObjectId(user_id_str)}},
                        upsert=True
                    )

                    socketio.emit("fingerprint_enrolled", {"user_id": user_id_str}, namespace='/')

                    # Cleanup
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
                return False

            device_count = zkfp2.GetDeviceCount()
            if device_count == 0:
                logger.error("❌ No fingerprint scanner detected.")
                zkfp2.Terminate()
                return False

            zkfp2.OpenDevice(0)
            zkfp2.Light("green")
            logger.info("🟢 Fingerprint scanner initialized successfully.")

            scanner_initialized = True
            keep_alive = True
            load_templates()

            Thread(target=listen_to_fingerprints, daemon=True).start()
            return True

        except Exception as e:
            logger.error(f"❌ Exception initializing scanner: {e}")
            return False


def shutdown_scanner():
    """Safely shuts down the fingerprint scanner."""
    global keep_alive, scanner_initialized, current_fid

    with scanner_lock:
        if not scanner_initialized:
            logger.warning("⚠️ Scanner already shut down.")
            return jsonify({"message": "Scanner was not running."}), 200

        logger.info("🟠 Shutting down fingerprint scanner...")

        try:
            zkfp2.Light('green')
            current_fid = None
            keep_alive = False
            zkfp2.CloseDevice()
            zkfp2.Terminate()
            scanner_initialized = False
            logger.info("🔴 Fingerprint scanner shut down successfully.")
            return jsonify({"message": "Scanner shut down."}), 200

        except Exception as e:
            logger.error(f"❌ Error shutting down scanner: {e}")
            zkfp2.Light('red')
            return jsonify({"error": "Failed to shut down scanner."}), 500


@app.route('/init', methods=['POST'])
def api_initialize_scanner():
    """API endpoint to initialize the scanner."""
    if initialize_scanner():
        zkfp2.Light('red', 3)
        zkfp2.Light('green', 3)
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


@app.route('/enroll', methods=['POST'])
def enroll():
    """API endpoint to enroll a new fingerprint with a specific user ID."""
    global register_mode, current_fid

    if register_mode:
        zkfp2.Light('red')
        return jsonify({"error": "Enrollment already in progress."}), 400

    data = request.get_json()
    user_id = data.get("user_id")  # Get user_id from request body
    
    
    logger.info(f"🖥️ Frontend connected to WebSocket.{user_id}")


    if user_id is None:
        
        return jsonify({"error": "User ID is required!. Choose a different ID."}), 400

    current_fid = user_id  # Default to the next available ID
    # Check if user already exists in MongoDB
    existing_user = fingerprint_collection.find_one({"_id": current_fid})
    if existing_user:
        zkfp2.Light('red', 3)
        return jsonify({"error": "User ID already exists. Choose a different ID."}), 400

    register_mode = True
    zkfp2.Light('green', 3)
    return jsonify({
        "message": "Place the same finger three times to enroll.",
        "user_id": user_id
    }), 200

@socketio.on("connect")
def handle_connect():
    """Handle WebSocket connection."""
    logger.info("🖥️ Frontend connected to WebSocket.")
    emit("server_response", {"message": "Connected to WebSocket!"})

@socketio.on("init")
def socket_initialize_scanner():
    """INIT WebSocket connection."""
    initialize_scanner()
    logger.info("🖥️ Frontend connected to WebSocket.")
    emit("server_response", {"message": "Connected to WebSocket!"})


@socketio.on("shutdown")
def socket_shutdown_scanner():
    """Shutdown WebSocket connection."""
    shutdown_scanner()
    logger.info("🖥️ Frontend connected to WebSocket.")
    emit("server_response", {"message": "Shutdown WebSocket!"})


if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)

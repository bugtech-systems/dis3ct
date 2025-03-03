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
from pymongo import MongoClient
from datetime import datetime

sys.dont_write_bytecode = True

# MongoDB Configuration
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "fingerprintDB"
COLLECTION_NAME = "fingerprints"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
fingerprint_collection = db[COLLECTION_NAME]

# Flask Setup
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Logging Setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("FingerprintAPI")

# Fingerprint SDK Variables
zkfp2 = ZKFP2()
scanner_lock = Lock()
scanner_initialized = False
keep_alive = False
loaded_templates = False
enrollment_data = {}  # Stores fingerprint samples per user (user_id -> list of templates)


def load_templates():
    """Load fingerprint templates from MongoDB only on first initialization."""
    global loaded_templates
    if loaded_templates:
        return
    zkfp2.DBInit()
    fingerprints = fingerprint_collection.find({})
    for record in fingerprints:
        fid = record["user_id"]
        templates = record["templates"]
        try:
            reg_temp, _ = zkfp2.DBMerge(*[bytes.fromhex(t) for t in templates])
            zkfp2.DBAdd(fid, reg_temp)
        except Exception as e:
            logger.error(f"Error loading fingerprint {fid}: {e}")
    loaded_templates = True


def shutdown_scanner():
    """Safely shuts down the fingerprint scanner before reinitializing."""
    global keep_alive, scanner_initialized

    with scanner_lock:
        if not scanner_initialized:
            logger.warning("Scanner is already shut down.")
            return

        logger.info("Shutting down scanner...")

        # Stop the fingerprint capture loop
        keep_alive = False
        sleep(1)  # Allow threads to exit properly

        try:
            zkfp2.CloseDevice()
            zkfp2.Terminate()
            scanner_initialized = False
            logger.info("✅ Fingerprint scanner shut down successfully.")
        except Exception as e:
            logger.error(f"❌ Error shutting down scanner: {e}")




def initialize_scanner():
    """Initialize the fingerprint scanner, ensuring proper shutdown first."""
    global scanner_initialized, keep_alive

    if scanner_initialized:
        logger.warning("Scanner is already initialized. Reinitializing...")
        shutdown_scanner()
        sleep(2)  # Wait before restarting to ensure clean initialization

    with scanner_lock:
        try:
            logger.info("🔄 Initializing fingerprint scanner...")

            if zkfp2.Init() is not None:
                logger.error("❌ Scanner initialization failed.")
                return False

            if zkfp2.GetDeviceCount() == 0:
                logger.error("❌ No fingerprint scanner detected.")
                zkfp2.Terminate()
                return False

            zkfp2.OpenDevice(0)
            scanner_initialized = True
            keep_alive = True

            # Load fingerprints only on first initialization
            load_templates()

            # Start listening in a clean thread
            thread = Thread(target=listen_to_fingerprints, daemon=True)
            thread.start()

            logger.info("✅ Scanner initialized successfully.")
            return True
        except Exception as e:
            logger.error(f"❌ Error initializing scanner: {e}")
            return False


def capture_handler(user_id=None):
    """Handles fingerprint capture for both enrollment and verification."""
    try:
        with scanner_lock:
            capture = zkfp2.AcquireFingerprint()

        if not capture:
            socketio.emit("fingerprint_not_found", {"message": "No finger detected."})
            logger.info("🚫 No finger detected.")
            return

        if len(capture) == 2:  # Case: (fid, template)
            fid, template = capture
            score = None
        elif len(capture) == 3:  # Case: (fid, score, template)
            fid, score, template = capture
        else:
            logger.error(f"❌ Unexpected fingerprint format: {capture}")
            return

        logger.info(f"🖐 Fingerprint Captured: FID={fid}, Score={score}")

        if user_id:  # Enrollment mode
            if user_id not in enrollment_data:
                enrollment_data[user_id] = []

            enrollment_data[user_id].append(template.hex())

            socketio.emit("fingerprint_scan", {
                "scan_count": len(enrollment_data[user_id]),
                "total_scans": 3
            })

            if len(enrollment_data[user_id]) == 3:  # Enrollment complete
                try:
                    reg_temp, _ = zkfp2.DBMerge(*[bytes.fromhex(t) for t in enrollment_data[user_id]])
                    zkfp2.DBAdd(user_id, reg_temp)

                    # Save in MongoDB
                    fingerprint_collection.update_one(
                        {"user_id": user_id},
                        {"$set": {"templates": enrollment_data[user_id], "created_at": datetime.utcnow()}},
                        upsert=True
                    )

                    socketio.emit("enrollment_complete", {"user_id": user_id, "status": "success"})
                    logger.info(f"✅ Enrollment completed for user {user_id}.")
                except Exception as e:
                    logger.error(f"❌ Enrollment error for user {user_id}: {e}")
                    socketio.emit("enrollment_complete", {"user_id": user_id, "status": "failed"})

                enrollment_data.pop(user_id)

        else:  # Verification mode (fingerprint matching)
            user_record = fingerprint_collection.find_one({"user_id": fid})
            if user_record:
                socketio.emit("fingerprint_verified", {"user_id": fid, "score": score})
                logger.info(f"✅ Fingerprint matched! User ID: {fid}")
            else:
                socketio.emit("fingerprint_not_verified", {})
                logger.warning("🚫 Fingerprint not recognized.")

    except Exception as e:
        logger.error(f"❌ Error handling fingerprint capture: {e}")
    

def listen_to_fingerprints():
    """Continuously listen for fingerprint scans."""
    global keep_alive
    logger.info("👂 Listening for fingerprint scans...")
    
    try:
        while keep_alive:
            with scanner_lock:
                capture = zkfp2.AcquireFingerprint()

            if capture:
                if len(capture) == 3:  # Ensure all expected values are present
                    fid, score, template = capture
                    logger.info(f"🖐 Fingerprint Captured: FID={fid}, Score={score}")
                    socketio.emit("fingerprint_scan", {"fid": fid, "score": score})
                else:
                    logger.warning(f"⚠️ Incomplete capture received: {capture}")  # Log unexpected cases
            sleep(0.1)
    except Exception as e:
        logger.error(f"❌ Error in fingerprint listener: {e}")
        shutdown_scanner()


@app.route("/init", methods=["POST"])
def api_initialize_scanner():
    """API to initialize scanner."""
    if initialize_scanner():
        return jsonify({"message": "Scanner initialized successfully."}), 200
    return jsonify({"error": "Failed to initialize scanner."}), 500


@app.route("/shutdown", methods=["POST"])
def api_shutdown_scanner():
    """API to shut down scanner."""
    shutdown_scanner()
    return jsonify({"message": "Scanner shut down."}), 200


@socketio.on("init")
def socket_initialize_scanner():
    """Socket event to initialize scanner."""
    initialize_scanner()
    emit("server_response", {"message": "Scanner initialized."})


@socketio.on("shutdown")
def socket_shutdown_scanner():
    """Socket event to shut down scanner."""
    shutdown_scanner()
    emit("server_response", {"message": "Scanner shut down."})


@socketio.on("enroll")
def socket_enroll_fingerprint(data):
    """Start fingerprint enrollment for a given user_id."""
    user_id = data.get("user_id")
    if not user_id:
        emit("enrollment_error", {"error": "User ID is required"})
        return

    enrollment_data[user_id] = []  # Reset any previous enrollment data
    emit("enrollment_started", {"user_id": user_id})
    Thread(target=capture_handler, args=(user_id,), daemon=True).start()


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000, allow_unsafe_werkzeug=True)

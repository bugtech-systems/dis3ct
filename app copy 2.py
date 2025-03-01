import sys
import logging
import threading
from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from pyzkfp import ZKFP2
from time import sleep
from pymongo import MongoClient
from bson import ObjectId

sys.dont_write_bytecode = True

# MongoDB Configuration
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "fingerprintDB"

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
fingerprint_collection = db["fingerprints"]

# Flask Setup
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Logging Setup
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger('FingerprintAPI')

# Fingerprint SDK Variables
zkfp2 = ZKFP2()
scanner_lock = threading.Lock()
scanner_initialized = False
keep_alive = False
monitor_thread_running = False  # Prevents multiple monitor threads

def is_device_connected():
    """Check if a biometric device is connected."""
    try:
        return zkfp2.GetDeviceCount() > 0
    except Exception as e:
        logger.error(f"❌ Error checking biometric device: {e}")
        return False

def initialize_scanner():
    """Initialize the fingerprint scanner when a device is available."""
    global scanner_initialized, keep_alive
    if scanner_initialized:
        logger.warning("⚠️ Scanner already initialized.")
        return True

    with scanner_lock:
        if not is_device_connected():
            logger.warning("❌ No device detected. Waiting for connection...")
            return False  # Don't terminate SDK, wait for monitoring

        logger.info("🟡 Initializing fingerprint scanner SDK...")
        try:
            if zkfp2.Init() is not None:
                logger.error("❌ SDK initialization failed.")
                return False

            zkfp2.OpenDevice(0)
            zkfp2.Light("green")
            logger.info("🟢 Fingerprint scanner initialized successfully.")

            scanner_initialized = True
            keep_alive = True
            return True

        except Exception as e:
            logger.error(f"❌ Exception initializing scanner: {e}")
            return False

def shutdown_scanner():
    """Safely shuts down the fingerprint scanner."""
    global scanner_initialized, keep_alive
    with scanner_lock:
        if not scanner_initialized:
            logger.warning("⚠️ Scanner already shut down.")
            return jsonify({"message": "Scanner was not running."}), 200

        logger.info("🟠 Shutting down fingerprint scanner...")
        try:
            keep_alive = False
            sleep(1)
            zkfp2.CloseDevice()
            zkfp2.Terminate()
            scanner_initialized = False

            logger.info("🔴 Fingerprint scanner shut down successfully.")
            return jsonify({"message": "Scanner shut down."}), 200

        except Exception as e:
            logger.error(f"❌ Error shutting down scanner: {e}")
            return jsonify({"error": "Failed to shut down scanner."}), 500

def monitor_device_connection():
    """Continuously monitors the device connection status."""
    global monitor_thread_running
    if monitor_thread_running:
        return  # Prevent duplicate monitoring threads

    monitor_thread_running = True
    logger.info("🔄 Starting device connection monitor...")

    device_was_connected = is_device_connected()
    
    while True:
        sleep(2)  # Check every 2 seconds
        device_connected = is_device_connected()

        if device_connected and not device_was_connected:
            logger.info("🔌 Device plugged in. Initializing scanner...")
            initialize_scanner()
            socketio.emit("device_connected", {"message": "Device plugged in and initialized."})

        elif not device_connected and device_was_connected:
            logger.warning("⚠️ Device unplugged. Shutting down scanner...")
            shutdown_scanner()
            socketio.emit("device_disconnected", {"message": "Device unplugged."})

        device_was_connected = device_connected

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

if __name__ == "__main__":
    threading.Thread(target=monitor_device_connection, daemon=True).start()  # Start monitoring in background
    socketio.run(app, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)

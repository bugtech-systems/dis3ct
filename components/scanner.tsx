"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
// import io from "socket.io-client";
import { useComponent } from "./providers/ComponentContext";
import getFingerId from "@/actions/getFingerId";
import getContactId from "@/actions/getContactId";
import { ViewContactForm } from "./contacts/ViewContactForm";
import { connectSocket, getSocket } from "@/lib/socket";



export function ScannerForm() {
  const { modal, setModal, modalId, biometricRunning, setBiometricRunning } = useComponent();
  const [scannerStatus, setScannerStatus] = React.useState("Disconnected");
  const [scanProgress, setScanProgress] = React.useState(0);
  const [record, setRecord] = React.useState(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isEnrolling, setIsEnrolling] = React.useState(false);
  const [fingerPrintId, setFingerPrintId] = React.useState(null)
  let socket = getSocket()


  const handleFingerPrint = async () => {
    let finger = await getFingerId(modalId);
    if (finger) {
      setFingerPrintId(finger.id)
    }
  }

  const handleRecord = async (id) => {
    setModal(null)
    let finger = await getContactId(id);
    if (finger) {
      setRecord(finger)
      setModal('viewContact', finger._id)
      // setFingerPrintId(finger.id)

    }
  }

  React.useEffect(() => {
    if (modal === "scanner" && biometricRunning) {
      console.log("🔄 Scanner modal opened. Initializing scanner...");
      handleFingerPrint()
      handleInit();
      // handleShutdown(() => handleInit());

    }

    return () => {
      if (modal === "scanner") {
        socket?.emit("stop_enroll");
        setIsEnrolling(false);
        setScanProgress(0)
        // handleShutdown()
      }

    }
  }, [modal]);

  React.useEffect(() => {
    if (biometricRunning && socket) {
      socket.on("connect", () => {
        console.log("✅ Socket connected!");
        setBiometricRunning(true)
        setScannerStatus("Connected");
        setIsConnected(true);

      });

      socket.on("server_response", (data) => {
        console.log("📡 Server Response:", data.message);
        setScannerStatus(data.message);
      });

      socket.on("status_response", (data) => {
        console.log("📡 Status Response:", data);
      });

      socket.on("scanner_ready", () => {
        console.log("🟢 Scanner is ready.");
        setScannerStatus("Ready");
        setIsConnected(true);
      });

      socket.on("scanner_disconnected", () => {
        console.warn("🔴 Scanner disconnected.");
        setScannerStatus("Disconnected");
        setIsConnected(false);
      });

      socket.on("fingerprint_enrolled", (data) => {
        console.log("🔍 Fingerprint Verified for User:", data);
        handleRecord(data.user_id)
        // toast.success(`Fingerprint matched! User ID: ${data.user_id}`);
      });

      socket.on("fingerprint_scan", (data) => {
        console.log("📝 Fingerprint Scan Step:", data.step);
        setScanProgress(data.step);
        if (data.step >= 3) {
          toast.success("✅ Fingerprint enrolled successfully!");
          setScanProgress(0);
          setIsEnrolling(false);
          setModal(null)
        }
      });

      socket.on("fingerprint_verified", (data) => {
        console.log("🔍 Fingerprint Verified for User:", data.user_id);
        handleRecord(data.user_id)
        // toast.success(`Fingerprint matched! User ID: ${data.user_id}`);
      });

      socket.on("fingerprint_not_verified", () => {
        console.warn("⚠️ Fingerprint not recognized.");
        setIsEnrolling(false);
        setScanProgress(0);
        toast.error("Fingerprint not recognized.");
        setModal(null)
        setRecord(null)
      });

      socket.on("enrollment_started", (data) => {
        // console.log(`🆕 Enrollment started for User ID: ${data.user_id}`);
        // toast.success(`Enrollment started for User ID: ${data.user_id}.`);
      });

      socket.on("enrollment_error", (data) => {
        console.error("❌ Enrollment Error:", data.error);
        toast.error(data.error);
        setIsEnrolling(false);
      });
    }

    return () => {
      if (biometricRunning && socket) {

        console.log("🚪 Cleaning up socket listeners...");
        socket.off("connect");
        socket.off("server_response");
        socket.off("scanner_ready");
        socket.off("scanner_disconnected");
        socket.off("fingerprint_scan");
        socket.off("fingerprint_verified");
        socket.off("fingerprint_enrolled");
        socket.off("fingerprint_not_verified");
        socket.off("enrollment_started");
        socket.off("enrollment_error");
      }

    };
  }, [biometricRunning]);

  const handleInit = () => {
    // handleShutdown()
    if (biometricRunning) {

      // setBiometricRunning(false)
      // socket = connectSocket();
      console.log("🔄 Initializing scanner...");
      setScannerStatus("Initializing...");
      setIsEnrolling(false);
      setScanProgress(0);
      socket?.emit("stop_enroll");
      socket?.emit("init");
      setScannerStatus("Connected");
      setIsConnected(true);
    }

  };

  const handleShutdown = (callback?: any) => {
    console.log("🛑 Shutting down scanner...");
    socket?.emit("shutdown", () => {
      console.log("⏳ Waiting before reinitializing...");
      if (callback) {
        setTimeout(callback, 5000);
      }
    });
  };

  const handleEnroll = () => {

    socket = connectSocket();


    if (!isConnected) {
      console.warn("⚠️ Scanner is not connected.");
      toast.error("Scanner is not connected");
      return;
    }
    if (isEnrolling) {
      console.warn("⚠️ Enrollment already in progress.");
      toast.error("Enrollment is already in progress");
      return;
    }
    setIsEnrolling(true);
    console.log(`📌 Starting fingerprint enrollment for User ID: ${modalId}`, socket);
    socket?.emit("enroll", { user_id: modalId, fingerPrintId });
    toast.success("Enrollment started. Scan your fingerprint.");
  };



  return (
    <>
      <Dialog open={modal === "scanner"} onOpenChange={(e) => setModal(e)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fingerprint Scanner</DialogTitle>
            <DialogDescription>Status: {scannerStatus}</DialogDescription>
          </DialogHeader>
          {(isConnected && biometricRunning) ? (
            <>
              {isEnrolling && <p>Scan Progress: {scanProgress}/3</p>}
              <Button onClick={handleEnroll} disabled={isEnrolling}>
                {isEnrolling ? "Enrolling..." : "Enroll Fingerprint"}
              </Button>
            </>
          ) : (
            <Button onClick={handleInit}>Reconnect</Button>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                console.log("🚪 Closing scanner modal...");
                handleInit();
                // handleShutdown(() => handleInit());
              }}
            >
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                console.log("🚪 Closing scanner modal...");
                setModal(null);
                handleShutdown(() => { });
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>

  );
}
``

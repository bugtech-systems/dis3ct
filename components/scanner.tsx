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
import clearFingerId from "@/actions/clearFingerId";

let socket = getSocket()


export function ScannerForm() {
  const { modal, setModal, biometricRunning, setBiometricRunning, record, setRecord } = useComponent();
  const [scannerStatus, setScannerStatus] = React.useState("Disconnected");
  const [scanProgress, setScanProgress] = React.useState(0);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isEnrolling, setIsEnrolling] = React.useState(false);
  const [fingerPrintId, setFingerPrintId] = React.useState(null)
  const [fingerPrint, setFingerPrint] = React.useState(null);
  const [error, setError] = React.useState(null);


  const handleFingerPrint = async (id) => {
    let finger = await getFingerId(id);
    setFingerPrint(finger)
    setFingerPrintId(finger.id)
  }

  const handleRecord = async (id) => {
    // setModal(null)
    let finger = await getContactId(id);
    if (finger) {
      setRecord(finger)
      setModal('viewContact', finger._id)
      // setFingerPrintId(finger.id)
    }
  }

  React.useEffect(() => {
    if (modal === "scanner") {
      console.log("🔄 Scanner modal opened. Initializing scanner...");
      handleFingerPrint(record?._id)
      handleInit();
      // handleShutdown(() => handleInit());

    }

    if (modal == 'searchScanner') {
      handleInit();
    }

    return () => {
      if (modal && (modal !== 'scanner' && modal !== 'searchScanner')) {
        handleShutdown(() => { });
      }

      if (modal === "scanner") {
        socket?.emit("stop_enroll");
        setIsEnrolling(false);
        setScanProgress(0)
      }

    }
  }, [modal]);

  React.useEffect(() => {
    if (socket && (modal == 'scanner' || modal == 'searchScanner')) {
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
        setScannerStatus("Fingerprint not recognized.");
        setError('Fingerprint not recognized.')
        // toast.error("Fingerprint not recognized.");
        // setModal(null)
        // setRecord(null)
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

      socket.on("fingerprint_deleted", async (data) => {
        await clearFingerId(record._id)
        // console.error("❌ Enrollment Error:", data.error);
        // toast.error(data.error);
        setIsEnrolling(false);
      });


    }

    return () => {
      if (socket && (modal == 'scanner' || modal == 'searchScanner')) {
        setError(null)
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
        socket.off("fingerprint_deleted");
      }

    };
  }, [modal]);

  const handleInit = () => {
    // handleShutdown()
    socket = connectSocket();
    console.log("🔄 Initializing scanner...");
    setScannerStatus("Initializing...");
    setIsEnrolling(false);
    setScanProgress(0);
    socket?.emit("init");
    socket?.emit("stop_enroll");
    setScannerStatus("Connected");
    setIsConnected(true);

  };

  const handleShutdown = (callback?: any) => {
    console.log("🛑 Shutting down scanner...");
    socket?.emit("shutdown", () => {
      console.log("⏳ Waiting before reinitializing...");
      // setFingerPrint(null)
      // setFingerPrintId(null)
      // setRecord(null)
      if (callback) {
        setTimeout(callback, 5000);
      }
    });
    setFingerPrint(null)
    setFingerPrintId(null)
    setRecord(null)
    setError(null)
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
    console.log(`📌 Starting fingerprint enrollment for User ID: ${record._id}`, socket);
    socket?.emit("enroll", { user_id: record._id, fingerPrintId });
    toast.success("Enrollment started. Scan your fingerprint.");
  };


  const handleDelete = (fingerId) => {

    socket = connectSocket();


    /*    if (!isConnected) {
         console.warn("⚠️ Scanner is not connected.");
         toast.error("Scanner is not connected");
         return;
       }
       if (isEnrolling) {
         console.warn("⚠️ Enrollment already in progress.");
         toast.error("Enrollment is already in progress");
         return;
       } */
    // console.log(`📌 Starting fingerprint enrollment for User ID: ${record._id}`, socket);
    socket?.emit("delete_fingerprint", { user_id: record._id, fingerPrintId: fingerId });
    socket?.emit("stop_enroll");
    setIsEnrolling(false);
    setScanProgress(0);
    handleFingerPrint(record._id)
    // handleEnroll()
    toast.success("Scan your fingerprint. To enroll again.");
  };



  // console.log(record, fingerPrint, 'RECORD')

  return (
    <>
      <Dialog open={modal === "scanner" || modal == "searchScanner"} onOpenChange={(e) => {
        setModal(null);
        handleShutdown(() => { });
      }}>
        {modal == "scanner" ?

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Biometric Enrollment</DialogTitle>
              <DialogDescription>Status: {scannerStatus}</DialogDescription>
            </DialogHeader>
            {record &&
              <div>
                Set finger print for: <br /> {record.name}
              </div>
            }
            {(fingerPrint && !fingerPrint?.exist) ? (
              <>
                {isEnrolling && <p>Scan Progress: {scanProgress}/3</p>}
                <Button onClick={handleEnroll} disabled={isEnrolling}>
                  {isEnrolling ? "Enrolling..." : "Enroll Fingerprint"}
                </Button>
              </>
            ) : (
              <Button onClick={() => handleDelete(fingerPrintId)}>Re-enroll</Button>
            )}

            <DialogFooter>
              {(isConnected && (fingerPrint && fingerPrint?.exist)) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("🚪 Closing scanner modal...");
                    handleInit();
                    // handleShutdown(() => handleInit());
                  }}
                >
                  Reset
                </Button>)}
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
          :
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Search Biometric</DialogTitle>
              <DialogDescription>Status: <span className={`${error ? 'text-red-500' : 'text-gray-800'}`}>{scannerStatus}</span></DialogDescription>
            </DialogHeader>
            {record &&
              <div>
                Search finger print
              </div>
            }
            <>
              <Button onClick={() => handleInit()} disabled={isConnected}>
                Start Scanning
              </Button>
            </>
            <DialogFooter>

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
        }



      </Dialog>
    </>

  );
}
``

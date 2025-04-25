"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FingerprintIcon, RefreshCw } from "lucide-react";
import { useComponent } from "./providers/ComponentContext";
import { Button } from "./ui/button";
import { useContact } from "./providers/ContactProvider";
import { findFeature } from "@/lib/helpers";
import { connectSocket, getSocket } from "@/lib/socket";
import getContactId from "@/actions/getContactId";
import toast from "react-hot-toast";
import Link from "next/link";


export default function ScannerButton() {
  const { setScannerStatus, setBiometricRunning, setError, setRecord, setModal, modal, isEnrolling, setIsEnrolling, biometricConnected, setBiometricConnected } = useComponent();
  const { parentSystem, user } = useContact();
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  let socket = getSocket();
  let timeout: any;

  const handleRefresh = async () => {
    // setBiometricRunning(true)
    // setRefreshId(Math.random());
    // setIsRefreshing(true);
    // Simulate spinning animation for 1.5s (3 spins)
    // await new Promise((resolve) => setTimeout(resolve, 30000));

    // setIsRefreshing(false);
    // window.location.reload()
    // router.refresh();
    socket?.emit("check_status");
    socket?.emit("init");
    setLoading(true);
    setIsConnected(true)
    setIsEnrolling(false)
    handleTimeout()


  };



  const handleTimeout = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      setLoading(false);
      // socket?.emit('shutdown')

    }, 30000);
  }

  const handleRecord = async (id) => {
    // setModal(null)
    let finger = await getContactId(id);
    if (finger) {
      setRecord(finger)
      setModal('viewContact', finger._id)
      setLoading(false)
      // setFingerPrintId(finger.id)
    }
  }

  useEffect(() => {
    socket = connectSocket();

    socket?.on("connect", () => {
      console.log("✅ Socket connected!");
      // setScannerStatus("Connected");
      setBiometricConnected(true)

      socket?.emit("check_status");

    });




    socket?.on("check_status_response", (data) => {
      if (data?.connected) {
        setBiometricRunning(true)
      } else {
        setBiometricRunning(false)
      }
      setBiometricConnected(true)
    });

    socket?.on("server_response", (data) => {
      setScannerStatus(data.message);
    });

    socket?.on("status_response", (data) => {
      setScannerStatus(data.message);
    });


    socket?.on("scanner_status", (data) => {
      console.log("📡 SCanner Response:", data.message);
      setScannerStatus(data.message);

    });

    socket?.on("fingerprint_verified", (data) => {
      console.log("📡 Verified Response:", data, isEnrolling, modal);
      if (!isEnrolling) {
        handleRecord(data.user_id)
        handleTimeout()
        // socket?.emit('shutdown')
      } else {
        setError('Already Exist')
        setScannerStatus('Already Exist');
      }
    });

    socket?.on("fingerprint_not_verified", (data) => {

      console.log("📡 Unverified Response:", data);
      toast.error("Fingerprint not recognized.");
      setModal(null)
      handleTimeout()
      // setScannerStatus(data.message);
    });

    return () => {

      console.log("🚪 Cleaning up socket listeners...");
      socket?.off("connect");
      socket?.off("server_response");
      socket?.off("status_response");
      socket?.off("check_status");
      socket?.off("check_status_response");
      socket?.off("scanner_status");
      socket?.off('fingerprint_not_verified')
      socket?.off('fingerprint_verified')

    };
  }, [isConnected, isEnrolling]);


  let parent = parentSystem?.parent ? parentSystem?.parent : user?.parent;
  return (
    <>
      {/* <Link href={`/scanner.html?id=${parentSystem?._id}`}>
        <Button>
          Scan
        </Button>
      </Link> */}
      {((parent && findFeature(parent?.configs, 'biometric').value) && biometricConnected) &&
        <Button
          variant="outline"
          size="sm"
          // className="mr-3 hidden h-8 lg:flex"
          onClick={handleRefresh}
          className="flex items-center justify-center text-sm font-medium rounded-md px-3 h-8 gap-1 text-primary hover:text-white border border-primary hover:bg-primary focus:ring-4 focus:outline-none focus:ring-primary py-2.5 text-center me-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800 disabled:opacity-50"
        >
          {!loading ?
            <FingerprintIcon
              className={`w-5 h-5 transition-transform`}
              style={{ animationDuration: "0.5s" }}
              color={modal == 'searchScanner' ? 'blue' : 'gray'}
            />
            :
            <RefreshCw
              className={`w-5 h-5 transition-transform ${loading ? "animate-spin" : ""
                }`}
              style={{ animationDuration: "0.5s" }}
            />
          }
          {!loading ?
            <span className="hidden sm:inline">Search Biometric</span>
            :
            <span className="hidden sm:inline">Scan Finger</span>
          }
        </Button>
      }
    </>

  );
}

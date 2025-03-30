"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FingerprintIcon, RefreshCw, ScanFaceIcon } from "lucide-react";
import { useComponent } from "./providers/ComponentContext";
import { Button } from "./ui/button";
import { useContact } from "./providers/ContactProvider";
import { findFeature } from "@/lib/helpers";
import { connectSocket, getSocket } from "@/lib/socket";
import getContactId from "@/actions/getContactId";
import toast from "react-hot-toast";


export default function FaceButton() {
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
    setLoading(true)
    setModal('facecam')
    setTimeout(() => {
      setLoading(false);
    }, 10000);


  };

  let parent = parentSystem?.parent ? parentSystem?.parent : user?.parent;


  return (
    <>
      {((parent && findFeature(parent?.configs, 'face').value) || user?.userType == 'admin') &&
        <Button
          variant="outline"
          size="sm"
          // className="mr-3 hidden h-8 lg:flex"
          onClick={() => handleRefresh()}
          className="flex items-center justify-center text-sm font-medium rounded-md px-3 h-8 gap-1 text-primary hover:text-white border border-primary hover:bg-primary focus:ring-4 focus:outline-none focus:ring-primary py-2.5 text-center me-2 dark:border-blue-500 dark:text-blue-500 dark:hover:text-white dark:hover:bg-blue-500 dark:focus:ring-blue-800 disabled:opacity-50"
        >
          {!loading ?
            <ScanFaceIcon
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
            <span className="hidden sm:inline">Search Face</span>
            :
            <span className="hidden sm:inline">Scan Face</span>
          }
        </Button>
      }
    </>

  );
}

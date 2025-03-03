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
import io from "socket.io-client";
import { useComponent } from "./providers/ComponentContext";

const socket = io("http://localhost:5000");

export function DeviceForm() {
  const { modal, setModal, modalId } = useComponent();
  const [scannerStatus, setScannerStatus] = React.useState("Disconnected");
  const [isConnected, setIsConnected] = React.useState(false);

  const handleInit = async () => {
    console.log("🔄 Initializing scanner...");
    try {




      const response = await fetch("/api/biometric/start", {
        method: "POST"
      });

      socket.emit("init");
      setScannerStatus("Initializing...");
      setIsConnected(true)

      const data = await response.json();
      console.log(data, 'RESP INIT')
      setScannerStatus("Connected!");

    } catch (err) {
      setIsConnected(false)
    }

  };

  const handleShutdown = async () => {
    console.log("🛑 Shutting down scanner...");
    setIsConnected(false)
    setScannerStatus("Device Shutdown!");
    socket.emit("shutdown")

    const response = await fetch("/api/biometric/stop", {
      method: "POST"
    });

    const data = await response.json();


    console.log(data, 'RESP SHUTDOWN')
  };


  const handleStatus = () => {
    socket.emit("check_status")
  }



  React.useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Socket connected!");
      setScannerStatus("Connected");
      setIsConnected(true);
    });

    socket.on("server_response", (data) => {
      console.log("📡 Server Response:", data.message);
      setScannerStatus(data.message);
      // setScannerStatus("Connected");
    });

    socket.on("status_response", (data) => {
      console.log("📡 Server Response:", data);
      // setScannerStatus(data.message);
      // setScannerStatus("Connected");
    });







    return () => {
      console.log("🚪 Cleaning up socket listeners...");
      socket.off("connect");
      socket.off("server_response");
      socket.off("status_response");
    };
  }, []);




  return (
    <Dialog open={modal === "devices"} onOpenChange={(e) => setModal(e)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurations</DialogTitle>
          <DialogDescription>Configure Devices</DialogDescription>
        </DialogHeader>
        <br />

        <p onClick={() => handleStatus()}>Biometric: {scannerStatus}</p>
        {isConnected ?
          <Button onClick={handleShutdown} >
            Stop Device
          </Button> :
          <Button onClick={handleInit} >
            Start Device
          </Button>
        }
        <DialogFooter>

          <Button
            variant="outline"
            onClick={() => {
              console.log("🚪 Closing scanner modal...");
              setModal(null);
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}

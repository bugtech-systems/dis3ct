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
import axios from "axios";
import { useContact } from "./providers/ContactProvider";
import { findFeature } from "@/lib/helpers";
import { connectSocket, getSocket } from "@/lib/socket";
import createTask from "@/actions/createTask";

let socket = getSocket()


export function DeviceForm() {
  const { modal, setModal, modalId, biometricRunning, setBiometricRunning } = useComponent();
  const { parentSystem, user } = useContact()
  const [scannerStatus, setScannerStatus] = React.useState("Disconnected");
  const [isConnected, setIsConnected] = React.useState(false);

  const handleInit = async () => {
    console.log("🔄 Initializing scanner...");
    try {

      socket = connectSocket();
      setBiometricRunning(true)



      const response = await fetch("/api/biometric/start", {
        method: "POST"
      });

      setScannerStatus("Initializing...");
      setIsConnected(true)

      const data = await response.json();
      console.log(data, 'RESP INIT')


      socket.emit('init')

    } catch (err) {
      setIsConnected(false)
    }

  };

  const handleShutdown = async () => {
    console.log("🛑 Shutting down scanner...");
    setIsConnected(false)
    setScannerStatus("Device Shutdown!");
    // socket.emit("shutdown")
    socket?.emit('shutdown')

    const response = await fetch("/api/biometric/stop", {
      method: "POST"
    });

    const data = await response.json();


    console.log(data, 'RESP SHUTDOWN')
    setBiometricRunning(false)

  };


  const handleStatus = () => {
    // socket.emit("check_status")
  }


  const handleRestartGsm = async () => {
    let apiUrl = process.env.TASK_URL ? process.env.TASK_URL : 'https://swc.sharewin.pro/api/tasks';

    let systemResp = await axios.get(`/api/contacts/save/system/${parentSystem?.phone}`);
    if (systemResp.data) {

      await createTask(apiUrl, {
        status: 'Todo',
        priority: 'Low',
        category: 'Background',
        title: 'GSM Module',
        taskObject: JSON.stringify({
          url: `http://127.0.0.1:23006/api/gsm/restart`,
          method: 'post',
          dataObject: {
            port: systemResp.data.port
            /* instruction */
          }
        })
      })
    }

  }


  React.useEffect(() => {
    console.log(modal == 'devices', socket, 'SOCKET')
    socket = getSocket()

    if (modal == 'devices') {

      if (socket?.connected) {
        setScannerStatus("Connected");
        setIsConnected(true);
        setBiometricRunning(true)

      }
      console.log(socket?.connected, 'con')
      socket?.on("connect", () => {
        console.log("✅ Socket connected!");
        setScannerStatus("Connected");
        setIsConnected(true);
      });


      socket?.on("server_response", (data) => {
        console.log("📡 Server Response:", data.message);
        setScannerStatus(data.message);
        // setScannerStatus("Connected");
      });

      socket?.on("status_response", (data) => {
        console.log("📡 Server Response:", data);
        // setScannerStatus(data.message);
        // setScannerStatus("Connected");
      });
    }

    return () => {
      if (modal == 'devices') {

        console.log("🚪 Cleaning up socket listeners...");
        socket?.off("connect")
        socket?.off("server_response");
        socket?.off("status_response");

      }

    };
  }, [socket, modal]);



  return (
    <Dialog open={modal === "devices"} onOpenChange={(e) => setModal(e)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurations</DialogTitle>
          <DialogDescription>Configure Devices</DialogDescription>
        </DialogHeader>
        <br />
        {(user?.userType == 'admin' || findFeature(parentSystem?.configs, 'biometric').value) &&
          <>
            <p onClick={() => handleStatus()}>Biometric: {scannerStatus}</p>
            {isConnected ?
              <Button onClick={() => handleShutdown()} >
                Stop Device
              </Button> :
              <Button onClick={() => handleInit()} >
                Start Device
              </Button>
            }
          </>
        }
        {(user?.userType == 'admin' || findFeature(parentSystem?.configs, 'sms').value) &&
          <>
            <p >GSM Module</p>
            <Button onClick={() => handleRestartGsm()} >
              Restart Device
            </Button>
          </>
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

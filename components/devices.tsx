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
import { useComponent } from "./providers/ComponentContext";
import axios from "axios";
import { useContact } from "./providers/ContactProvider";
import { findFeature } from "@/lib/helpers";
import { connectSocket, getSocket } from "@/lib/socket";
import createTask from "@/actions/createTask";



export function DeviceForm() {
  const { modal, setModal, scannerStatus, setScannerStatus, setBiometricRunning, setBiometricConnected, setIsEnrolling } = useComponent();
  const { parentSystem, user } = useContact();
  const [isConnected, setIsConnected] = React.useState(false);
  let socket = getSocket()

  const handleInit = async () => {
    console.log("🔄 Initializing scanner...");
    try {





      /*      const response = await fetch("/api/biometric/start", {
             method: "POST"
           });
      */
      // setScannerStatus("Starting");

      socket = connectSocket();
      setBiometricConnected(true);
      setIsEnrolling(true)
      setScannerStatus("Started");


      setIsConnected(true)

    } catch (err) {
      setIsConnected(false)
    }

  };

  const handleShutdown = async () => {
    console.log("🛑 Shutting down scanner...");
    setIsConnected(false)
    // setScannerStatus("Shutting");
    // socket.emit("shutdown")

    socket?.emit('shutdown')
    // socket?.disconnect()
    setScannerStatus("Stopped");

    /*   const response = await fetch("/api/biometric/stop", {
        method: "POST"
      }); */

    // const data = await response.json();


    // console.log(data, 'RESP SHUTDOWN')
    setBiometricRunning(false)
    setBiometricConnected(false)

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
        system: parentSystem?.phone,
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
    socket = getSocket()

    if (modal == 'devices') {

      if (socket?.connected) {
        setScannerStatus("Connected");
        // setBiometricRunning(true)
        setIsConnected(true)
        setBiometricConnected(true)
      }
      console.log(socket?.connected, 'con')



      socket?.on("server_response", (data) => {
        console.log("📡 Server Response:", data.message);
        setScannerStatus(data.message);
        // setScannerStatus("Connected");
      });

      socket?.on("status_response", (data) => {
        console.log("📡 Status Response:", data);
        // setScannerStatus(data.message);
        // setScannerStatus("Connected");
      });

      socket?.on("disconnect", (data) => {
        console.log("📡 Disconnect Response:", data);
        setScannerStatus("Shutdown");

        // setScannerStatus(data.message);
        // setScannerStatus("Connected");
      });

    }

    return () => {

    };
  }, [socket, modal, isConnected]);



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

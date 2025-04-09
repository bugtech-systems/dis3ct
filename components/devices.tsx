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

let STATIC_URL = process.env.STATIC_URL || 'http://localhost:3500';


export function DeviceForm() {
  const { modal, setModal, scannerStatus, setScannerStatus, setBiometricRunning, setBiometricConnected, setIsEnrolling } = useComponent();
  const { parentSystem, user } = useContact();
  const [faceapi, setFaceapi] = React.useState(null);
  const [status, setStatus] = React.useState('');
  const [syncables, setSyncables] = React.useState([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [modelsLoaded, setModelsLoaded] = React.useState(false);

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

  const handleSyncables = async () => {
    const response = await fetch("/api/public/syncs", {
      method: "GET"
    });
    const data = await response.json();

    if (data) {
      let { image, biometric } = data;
      let syncs = []
      image?.map(a => {
        syncs.push({
          ...a,
          sync: "image"
        });
      })
      biometric?.map(a => {
        syncs.push({
          ...a,
          sync: "biometric"
        });
      })
      setStatus(`${syncs.length} pending sync`)
      setSyncables(syncs)
    }
  }



  async function extractFaceDescriptor(imageUrl) {
    // Fetch the image

    if (!modelsLoaded) return console.log('model not loaded!')
    const img = await faceapi.fetchImage(imageUrl);

    // Detect face in the image and extract face descriptor
    const detections = await faceapi.detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detections) {
      // Return the face descriptor
      return detections.descriptor;
    } else {
      console.error('No face detected in the image.');
      return null;
    }
  }

  const handleSubmit = async () => {
    setStatus('Submitting data...');
    for (const data of syncables) {
      try {

        if (data?.sync == 'biometric') {


          const response = await fetch(`${STATIC_URL}/api/biometrics/register?id=${data?._id}`, {
            method: "POST",
          });

          if (response.ok) {
            console.log(`Successfully submitted: ${JSON.stringify(data)}`);
          } else {
            console.error(`Failed to submit: ${JSON.stringify(data)}`);
          }


        } else {


          /*  const descriptor = await extractFaceDescriptor(imageUrl);
           if (descriptor) {
             console.log('Face Descriptor:', descriptor);
           }
 
  */

        }

      } catch (error) {
        console.error('Error during submission:', error);
      }
    }
    setStatus('Data submission complete.');
  };

  const loadModels = async () => {
    try {
      const faceapiModule = await import('face-api.js');
      setFaceapi(faceapiModule);
      await faceapiModule.nets.ssdMobilenetv1.loadFromUri("/models");
      await faceapiModule.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapiModule?.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapiModule?.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapiModule?.nets.faceRecognitionNet.loadFromUri("/models");
      setModelsLoaded(true);
    } catch (error) {
      console.error("Error loading face-api models:", error);
    }
  };

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

  React.useEffect(() => {
    handleSyncables()
  }, [modal])

  React.useEffect(() => {
    loadModels();
  }, []);





  console.log(syncables, 'SYNCS')



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
        {(user?.userType == 'admin' || findFeature(parentSystem?.configs, 'sms').value) &&
          <>
            <p>Sync Data: {status}</p>
            <Button onClick={() => handleSubmit()} >
              Start Syncing
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

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
import { SyncView } from "./SyncView";

let STATIC_URL = process.env.STATIC_URL || 'http://localhost:3500';


export function DeviceForm() {
  const { modal, setModal, scannerStatus, setScannerStatus, setBiometricRunning, setBiometricConnected, setIsEnrolling } = useComponent();
  const { parentSystem, user } = useContact();
  const [faceapi, setFaceapi] = React.useState(null);
  const [status, setStatus] = React.useState('');
  const [syncables, setSyncables] = React.useState([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [modelsLoaded, setModelsLoaded] = React.useState(false);
  const [isView, setIsView] = React.useState(false);
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
    let apiUrl = process.env.TASK_URL ? process.env.TASK_URL : 'https://sharewin.pro/api/tasks';

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


  const handleRestartTemplates = async () => {

    let systemResp = await axios.post(`/api/biometric/clear`, { parent: parentSystem._id });
    handleSyncables()

  }



  const handleSyncables = async () => {


    let parent = user?.parent ? (user?.parent || user?.parent?._id) : (parentSystem?.parent || parentSystem?.parent?._id)
    const response = await fetch(`/api/public/syncs?parent=${parent?._id || parent}`, {
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
    const img = await faceapi.fetchImage(STATIC_URL + imageUrl);

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


          let descriptors = []
          let newTags = data?.tags?.filter(a => a.tagType == 'image').map(a => a.value);

          for (let pic of newTags) {
            const descriptor = await extractFaceDescriptor(pic);
            if (descriptor) {
              descriptors.push(descriptor)
            }
          }
          console.log('Face Descriptor:', descriptors);
          if (descriptors.length == 3) {
            const mergedDescriptor = mergeDescriptors(descriptors);
            console.log(mergedDescriptor, 'dddd')
            await axios.post(`/api/contacts/${data._id}/face/register`, { descriptor: mergedDescriptor, imgUrls: newTags });




          }



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

  function mergeDescriptors(descriptors) {
    const merged = new Float32Array(descriptors[0].length);
    descriptors.forEach(descriptor => {
      for (let i = 0; i < merged.length; i++) {
        merged[i] += descriptor[i];
      }
    });
    for (let i = 0; i < merged.length; i++) {
      merged[i] /= descriptors.length;
    }
    return merged;
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

  React.useEffect(() => {
    handleSyncables()
  }, [modal])

  React.useEffect(() => {
    loadModels();
  }, []);



  return (
    <Dialog open={modal === "devices"} onOpenChange={(e) => setModal(e)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurations</DialogTitle>
          <DialogDescription>Configure Devices</DialogDescription>
        </DialogHeader>
        <br />
        {isView ?
          <>
            <SyncView data={syncables} onBack={() => setIsView(false)} />
          </>
          :
          <>
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
            {/* {(user?.userType == 'admin' || findFeature(parentSystem?.configs, 'sms').value) &&
          <>
            <p >GSM Module</p>
            <Button onClick={() => handleRestartGsm()} >
              Restart Device
            </Button>
          </>
        } */}
            {(user?.userType == 'admin' || findFeature(parentSystem?.configs, 'sms').value) &&
              <>
                <p >GSM Module</p>
                <Button onClick={() => handleRestartTemplates()} >
                  Reset Templates
                </Button>
              </>
            }

            {(user?.userType == 'admin' || findFeature(parentSystem?.configs, 'sms').value) &&
              <>
                <div className="d-flex flex-row justify-around">
                  <span className="mr-auto">Sync Data: {status}</span><button onClick={() => setIsView(true)} className="float-end clickable text-blue">View</button>
                </div>
                <Button onClick={() => handleSubmit()} >
                  Start Syncing
                </Button>
              </>
            }
          </>
        }
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsView(false);
            }}
          >
            Back
          </Button>
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

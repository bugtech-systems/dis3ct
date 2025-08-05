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
import { checkImage, findFeature } from "@/lib/helpers";
import { connectSocket, getSocket } from "@/lib/socket";
import createTask from "@/actions/createTask";
import { SyncView } from "./SyncView";
import { Input } from "./ui/input";
import { imageExists } from '@/utils/imageExists'


let STATIC_URL = process.env.STATIC_URL || 'http://192.168.1.100:3500';


export function DeviceForm() {
  const { modal, setModal, scannerStatus, setScannerStatus, setBiometricRunning, setBiometricConnected, setIsEnrolling } = useComponent();
  const { parentSystem, user } = useContact();
  const [faceapi, setFaceapi] = React.useState(null);
  const [status, setStatus] = React.useState('');
  const [syncables, setSyncables] = React.useState([]);
  const [transferables, setTransferables] = React.useState([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [modelsLoaded, setModelsLoaded] = React.useState(false);
  const [isView, setIsView] = React.useState(null);
  const [host, setHost] = React.useState('');
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
    setIsConnected(!isConnected)
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

    let systemResp = await axios.post(`/api/biometric/clear`, { parent: parentSystem.parent });
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

  const handleTransferables = async () => {


    let parent = user?.parent ? (user?.parent || user?.parent?._id) : (parentSystem?.parent || parentSystem?.parent?._id)
    const response = await fetch(`/api/public/transferable?parent=${parent?._id || parent}`, {
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
      setTransferables(syncs)
    }
  }



  async function extractFaceDescriptor(imageUrl) {
    // Fetch the image
    if (!modelsLoaded) return console.log('model not loaded!')
    let isImg = await imageExists(STATIC_URL + imageUrl);
    if (!isImg) return console.log('Is not Image!')
    const options = new faceapi.TinyFaceDetectorOptions();

    const img = await faceapi.fetchImage(STATIC_URL + imageUrl);


    // Detect face in the image and extract face descriptor
    const detections = await faceapi.detectSingleFace(img, options)
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

  const handleSubmitSyncBio = async () => {
    setStatus('Submitting data...');
    for (const data of syncables) {

      if (data?.sync == 'biometric') {
        let newTags = data?.tags?.filter(async a => (a.tagType == 'biometrics' && await checkImage(STATIC_URL + a.value))).map(a => { return { value: a.value, isImage: checkImage(STATIC_URL + a.value) } });
        console.log(newTags, 'NEW TAGS')

        /*       const response = await fetch(`${STATIC_URL}/api/biometrics/register?id=${data?._id}`, {
                method: "POST",
              });
       */
        /*        if (response.ok) {
                 console.log(`Successfully submitted: ${JSON.stringify(data)}`);
               } else {
                 console.error(`Failed to submit: ${JSON.stringify(data)}`);
               } */

      }

    }
    setStatus('Data submission complete.');
  };

  const handleSubmitSyncImage = async () => {
    setStatus('Submitting data...');
    let inds = syncables.filter(a => a.sync == 'image')
    let i = inds.length;
    console.log(i)
    for (const data of inds) {
      console.log(!(data.descriptor && data.descriptor.length), 'DESC')
      if (data?.sync != 'biometric' && !(data.descriptor && data.descriptor.length)) {

        let descriptors = []
        let newTags = data?.tags?.filter(a => a.tagType == 'image').map(a => a.value);
        for (let pic of newTags) {

          const descriptor = await extractFaceDescriptor(pic);
          if (descriptor) {
            descriptors.push(descriptor)
          }
        }
        console.log('Face Descriptor:', descriptors);
        if (descriptors.length) {
          const mergedDescriptor = normalizeDescriptor(mergeDescriptors(descriptors));
          console.log(mergedDescriptor, 'dddd')
          await axios.post(`/api/contacts/${data._id}/face/register`, { descriptor: mergedDescriptor, imgUrls: newTags });
          i--
        }
      }
    }
    console.log(i, 'COUNTS')
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

  function normalizeDescriptor(descriptor: Float32Array): Float32Array {
    const norm = Math.sqrt(descriptor.reduce((sum, val) => sum + val * val, 0));
    return new Float32Array(descriptor.map(v => v / norm));
  }


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


  const handleSubmitImages = async () => {
    let images = transferables.filter(a => a.sync == 'image');
    console.log(images, 'IMAGES')
    for (const data of images) {
      console.log(data)
      let imgData = data?.tags?.filter(a => a.tagType == 'image')

      const formData = new FormData();

      for (const img of imgData) {
        if (!await checkImage(STATIC_URL + img.value)) {
          console.log('Cant Find Image')
        } else {
          const response = await fetch(STATIC_URL + img.value);
          const blob = await response.blob();
          const fileName = (STATIC_URL + img.value).split('/').pop() || 'upload.file';
          const file = new File([blob], fileName, { type: blob.type });
          formData.append("file", file);
        }
      }

    }

    const response = await fetch(`${host}/api/image/upload?id=${data?._id}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      // throw new Error('Upload failed');
      console.log('UPLOAD Failed')

    }

    const result = await response.json();
    console.log('Upload successful:', result);

  }


  // alert('File uploaded successfully!');





  const handleSubmitBiometrics = async () => {
    let biometrics = transferables.filter(a => a.sync == 'biometric');
    for (const data of biometrics) {
      console.log(data)
      let bios = data?.tags?.filter(a => a.tagType == 'biometrics')

      const formData = new FormData();

      for (const bio of bios) {
        if (!await checkImage(STATIC_URL + bio.value)) {
          console.log('Cant Find Biometric')
        } else {



          const response = await fetch(STATIC_URL + bio.value);
          const blob = await response.blob();
          const fileName = (STATIC_URL + bio.value).split('/').pop() || 'upload.file';
          const file = new File([blob], fileName, { type: blob.type });
          formData.append("file", file);
        }

      }



      const response = await fetch(`${host}/api/biometrics/upload?id=${data?._id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.log('UPLOAD Failed')
        // throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);

    }
    alert('File uploaded successfully!');

  }

  const handleSubmitTags = async () => {
    let biometrics = transferables.filter(a => a.sync == 'biometric');
    for (const data of biometrics) {
      console.log(data)
      let bios = data?.tags?.filter(a => a.tagType == 'biometrics')

      const formData = new FormData();

      for (const bio of bios) {
        if (!await checkImage(STATIC_URL + bio.value)) {
          console.log('Cant Find Biometric')
        } else {



          const response = await fetch(STATIC_URL + bio.value);
          const blob = await response.blob();
          const fileName = (STATIC_URL + bio.value).split('/').pop() || 'upload.file';
          const file = new File([blob], fileName, { type: blob.type });
          formData.append("file", file);
        }

      }

      const response = await fetch(`${host}/api/biometrics/upload?id=${data?._id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.log('UPLOAD Failed')
        // throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);

    }
    alert('File uploaded successfully!');

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



  React.useEffect(() => {
    handleTransferables();
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
            <SyncView data={isView == 'transfer' ? transferables : syncables} onBack={() => setIsView(null)} />
          </>
          :
          <>
            {(user?.userType == 'admin' || findFeature(parentSystem?.configs, 'biometric').value) &&
              <>
                <p onClick={() => handleStatus()}>Biometric: {scannerStatus}</p>
                {(isConnected && scannerStatus != 'Shutdown') ?
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
            {/* {(user?.userType == 'admin' || findFeature(parentSystem?.configs, 'sms').value) &&
              <>
                <p >GSM Module</p>
                <Button onClick={() => handleRestartTemplates()} >
                  Reset Templates
                </Button>
              </>
            } */}

            {(user?.userType == 'admin' || (findFeature(parentSystem?.configs, 'biometric' || findFeature(parentSystem?.configs, 'image').value))) &&
              <>
                <div className="d-flex flex-row justify-around">
                  <span className="mr-auto">Sync Data: {status}</span><button onClick={() => setIsView('sync')} className="float-end clickable text-blue">View</button>
                </div>
                <div className="d-flex flex-row justify-between w-full w-100">

                  <Button onClick={() => handleSubmitSyncImage()} >
                    sync image
                  </Button>&nbsp;&nbsp;&nbsp;
                  <Button onClick={() => handleSubmitSyncBio()} >
                    sync biometrics
                  </Button>
                </div>

              </>
            }
            <br />
            <div className="d-flex flex-col w-full">
              <div className="d-flex flex-row justify-around">
                <span className="mr-auto">Transfer: {status}</span><button onClick={() => setIsView('transfer')} className="float-end clickable text-blue">View</button>
              </div>
              <div className="d-flex flex-row justify-around w-full">
                <Button onClick={() => handleSubmitImages()} >
                  Upload Images
                </Button>&nbsp;&nbsp;&nbsp;
                <Button onClick={() => handleSubmitBiometrics()} >
                  Upload Biometrics
                </Button>
              </div>
              <br />
              <Input
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />

            </div>
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

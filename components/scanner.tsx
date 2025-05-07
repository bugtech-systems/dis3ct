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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import toast from "react-hot-toast";
// import io from "socket.io-client";
import { useComponent } from "./providers/ComponentContext";
import getFingerId from "@/actions/getFingerId";
import getContactId from "@/actions/getContactId";
import { connectSocket, getSocket } from "@/lib/socket";
import clearFingerId from "@/actions/clearFingerId";
import axios from "axios";
import { convertObjectToString } from "@/lib/helpers";
import { Delete } from "lucide-react";

const scanStages = [
  "/examples/finger0.jpg", // 0-33% progress
  "/examples/finger1.gif", // 0-33% progress
  "/examples/finger3.gif", // 34-66% progress
  "/examples/finger4.jpg", // 67-100% progress
];

let appUrl = process.env.STATIC_URL || 'http://localhost:3500'

export function ScannerForm() {
  const { modal, setModal, error, setError, biometricRunning, setBiometricRunning, setIsEnrolling, isEnrolling, biometricConnected, record, setRecord, scannerStatus, setScannerStatus } = useComponent();
  const [scanProgress, setScanProgress] = React.useState(0);
  const [isConnected, setIsConnected] = React.useState(false);
  // const [scanStages, setScanStages] = React.useState(["/examples/finger0.jpg"]);
  const [fingerPrintId, setFingerPrintId] = React.useState(null)
  const [fingerPrint, setFingerPrint] = React.useState(null);
  const [fingerFile, setFingerFile] = React.useState(null)
  const [fingerImage, setFingerImage] = React.useState<any>(null)
  const [fingerImages, setFingerImages] = React.useState([])
  const [rnd, setRnd] = React.useState(0);
  let socket = getSocket()


  const handleFingerPrint = async (id) => {
    let fingerData = await getFingerId(id);
    setFingerPrint(fingerData)
    let { finger } = fingerData;
    if (finger && finger.image_path) {
      setFingerFile(`${appUrl}${finger.image_path}`)
    } else {
      setFingerFile(null)
    }
    setFingerPrintId(fingerData.id)
  }

  const handleDeleteFinger = async (id) => {
    let newRecord = await clearFingerId(id);
    setRecord({ ...record, biometric: null })
    // setFingerPrint(finger)
    // setFingerPrintId(finger.id)
  }

  const handleRecord = async (id) => {
    // setModal(null)
    let finger = await getContactId(id);
    console.log(finger, 'FF', modal, record)
    if (finger && finger?._id != record?._id) {
      setRecord(finger)
      setModal('viewContact', finger._id)
      // setFingerPrintId(finger.id)
    }
  }


  const handleUpload = async () => {
    // setModal(null)
    if (fingerImages.length < 3) {
      toast.error("Please upload 3 biometric file");
      return
    }

    // const blob = await fetch(fingerFile).then(res => res.blob());
    const formData = new FormData();
    formData.append("file", fingerImages[0]?.file);
    formData.append("file", fingerImages[1]?.file);
    formData.append("file", fingerImages[2]?.file);


    const response = await fetch(`${appUrl}/api/biometrics/upload?id=${record?._id}`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (response.ok) {
      setModal(null)
      setRecord(null)
      toast.success('Uploaded Successfully')
    }

  }



  React.useEffect(() => {


    if (modal == 'scanner') {
      if (record?._id) {
        handleFingerPrint(record?._id)
        handleInit()
      }

      socket?.on("check_status_response", (data) => {
        if (data?.connected) {
          setBiometricRunning(true)
        } else {
          setBiometricRunning(false)
        }
      });


      if (socket?.connected) {
        setScannerStatus("Connected");
        socket.emit('check_status')
        setIsConnected(true);
        // setBiometricConnected(true)
      } else {
        setScannerStatus("Disconnected!!");
      }






      socket?.on("status_response", (data) => {
        console.log("📡 Status Response:", data);
      });

      socket?.on("scanner_ready", () => {
        console.log("🟢 Scanner is ready.");
        setScannerStatus("Ready");
        setIsConnected(true);
      });

      socket?.on("scanner_disconnected", () => {
        console.warn("🔴 Scanner disconnected.");
        setScannerStatus("Disconnected");
        setIsConnected(false);
      });

      socket?.on("fingerprint_enrolled", (data) => {
        console.log("🔍 Fingerprint Verified for User:", data);
        handleRecord(data.user_id)
        // toast.success(`Fingerprint m/atched! User ID: ${data.user_id}`);
      });

      // socket?.on('fingerprint_image', (data) => {
      //   console.log(data, 'IMAGE')

      //   setFingerImage(`data:image/jpeg;base64,${data.image}`)
      // });

      socket?.on("fingerprint_scan", (data) => {
        console.log(data, 'data')
        console.log("📝 Fingerprint Scan Step:", data.step);
        setScanProgress(data.step);
        setScannerStatus('Enrolling.. ')
        setError(null)
        if (data.step >= 3) {
          console.log(data, 'SUCCESS')
          toast.success("✅ Fingerprint enrolled successfully!");
          // setScanProgress(0);
          // setIsEnrolling(false);
          // setModal('viewContact', record._id)
        }
      });


      socket?.on("enrollment_started", (data) => {
        console.log(`🆕 Enrollment started for User ID: ${data.user_id}`);
        // toast.success(`Enrollment started for User ID: ${data.user_id}.`);
      });

      socket?.on("enrollment_error", (data) => {
        console.log("❌ Enrollment Error:", data);
        toast.error("❌ Enrollment Error");
        setIsEnrolling(false);
      });

      socket?.on("fingerprint_deleted", async (data) => {
        await clearFingerId(record._id)
        // console.error("❌ Enrollment Error:", data.error);
        // toast.error(data.error);
        setIsEnrolling(false);
      });
    }



    return () => {
      if (modal == 'scanner') {
        socket?.off("server_response");
        socket?.off("scanner_ready");
        socket?.off("scanner_disconnected");
        socket?.off("fingerprint_scan");
        socket?.off("fingerprint_enrolled");
        socket?.off("enrollment_started");
        socket?.off("enrollment_error");
        socket?.off("fingerprint_image");
        // socket?.off("fingerprint_not_verified");
        // socket?.off("fingerprint_verified");
        console.log("🚪 Cleaning up socket listeners...");
      }


    };
  }, [modal]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    let fImages = fingerImages;
    if (file) {
      const reader = new FileReader();


      if (fImages.length >= 3) {
        fImages = []
      }


      reader.onloadend = () => {
        fImages.push({ file, img: reader.result });
        setScanProgress(fImages.length);
        setFingerImages(fImages)
      };
      reader.readAsDataURL(file);


      setFingerImage(file)
      setIsEnrolling(true);


      // const reader = new FileReader();
      // reader.onloadend = () => {
      //   setFingerFile(reader.result);
      // };
      // reader.readAsDataURL(file);
    }
  };


  const handleInit = () => {
    // handleShutdown()
    socket = connectSocket();
    console.log("🔄 Initializing scanner...");
    setIsEnrolling(false);
    setScanProgress(0);
    setFingerImages([])

    socket?.emit("stop_enroll");
    socket?.emit("init");
    setBiometricRunning(true)
    // setBiometricConnected(true)
    setIsConnected(true);
    setError(null)
  };

  const handleShutdown = (callback?: any) => {
    console.log("🛑 Shutting down scanner...");
    setFingerPrint(null)
    setFingerPrintId(null)
    setBiometricRunning(false)
    setRecord(null)
    setError(null)
    setModal(null)
    console.log("⏳ Waiting before reinitializing...");
    // setFingerPrint(null)
    // setFingerPrintId(null)
    // setRecord(null)
    if (callback) {
      setTimeout(callback, 5000);
    }

  };

  const handleEnroll = () => {


    if (!biometricConnected) {
      console.warn("⚠️ Scanner is not connected.");
      toast.error("Scanner is not connected");
      return;
    }
    if (isEnrolling) {
      console.warn("⚠️ Enrollment already in progress.");
      toast.error("Enrollment is already in progress");
      return;
    }
    setScanProgress(0);
    setIsEnrolling(true);
    setFingerImages([])
    setFingerImage(null)
    console.log(`📌 Starting fingerprint enrollment for User ID: ${record._id}`, socket, fingerPrintId);

    socket?.emit("enroll", { user_id: record._id, fingerPrintId });
    toast.success("Enrollment started. Scan your fingerprint.");
  };

  const handleDeleteFile = (ind) => {
    let fingers = fingerImages;

    fingers.splice(ind, 1)
    console.log(fingers, 'FFF')
    setScanProgress(fingers.length)
    setFingerImages(fingers)
    if (!fingers.length) {
      setIsEnrolling(false)
    }
    setRnd(Math.random())

  };

  const handleDelete = async (fingerId) => {

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
    const response = await fetch(`/api/biometric/clear`, {
      method: "POST",
      body: JSON.stringify({ contactId: record?._id })
    });

    const data = await response.json();
    console.log(data, 'DELETE FINGER DATA')
    setScanProgress(0);
    setFingerPrint(null)
    handleFingerPrint(record._id)
    handleDeleteFinger(record._id)
    setFingerFile(null)
    toast.success("Scan your fingerprint. To enroll again.");

  };


  const getGif = (progress) => {
    if (progress == 0) return scanStages[0];
    if (progress == 1) return scanStages[1];
    if (progress == 2) return scanStages[2];
    return scanStages[3];
  };




  return (
    <>
      <Dialog open={modal === "scanner"} onOpenChange={(e) => {
        /*   if ((modal === "scanner" || modal == "searchScanner" || modal == "viewContact")) {
          } */
        console.log('modal change', e)
        handleShutdown()
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Biometric Enrollment</DialogTitle>
            <DialogDescription>Status: <span className={`${error ? 'text-red-500' : 'text-gray-800'}`}>{scannerStatus}</span></DialogDescription>
          </DialogHeader>
          {record &&
            <>
              <div>
                Set finger print for: <br /> {record.name}
              </div>
              {/* <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" /> */}
            </>

          }

          {(!record?.biometric && fingerPrint && !fingerPrint?.exist) && (
            <>
              {isEnrolling && <p>Scan Progress: {scanProgress}/3</p>}
              {isEnrolling ?
                fingerImages.length ?
                  <>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />

                    <div className="d-flex flex-col justify-center items-center" style={{ marginBottom: '-10px', zIndex: -1 }}>

                      <Carousel className="w-full max-w-xs mr-auto ml-auto">
                        <CarouselContent>
                          {fingerImages.map((img, index) => (
                            <CarouselItem key={index}>
                              <div className="d-flex w-full flex-row justify-between">
                                <Delete
                                  size={15}
                                  className="float-end cursor-pointer"
                                  onClick={() => handleDeleteFile(index)}
                                />
                              </div>
                              <img src={img?.img} alt={`Captured ${index + 1}`} className="w-full rounded-lg shadow" />
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                      </Carousel>
                    </div>
                  </>
                  :
                  <div className="d-flex flex-row justify-center items-center" style={{ marginBottom: '-10px', zIndex: -1 }}>
                    <img src={fingerImage ? fingerImage : getGif(scanProgress)} className="w-50  ml-auto mr-auto" style={{ height: '300px' }} />
                  </div>
                : fingerFile ?
                  <div className="d-flex flex-row justify-center items-center" style={{ marginBottom: '-10px', zIndex: -1 }}>
                    <img src={fingerFile ? fingerFile : getGif(scanProgress)} className="w-50  ml-auto mr-auto" style={{ height: '300px' }} />
                  </div>
                  :
                  <>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />
                    <Button onClick={() => handleEnroll()} disabled={(isEnrolling)}>
                      {isEnrolling ? "Enrolling..." : "Enroll Fingerprint"}
                    </Button>
                  </>

              }
            </>
          )}
          {fingerFile &&
            <div className="d-flex flex-row justify-center items-center" style={{ marginBottom: '-10px', zIndex: -1 }}>
              <img src={fingerFile ? fingerFile : getGif(scanProgress)} className="w-50  ml-auto mr-auto" style={{ height: '300px' }} />
            </div>
          }
          <DialogFooter>

            {!(!record?.biometric && fingerPrint && !fingerPrint?.exist) ?
              <Button onClick={() => handleDelete(fingerPrintId)} >Re-enroll</Button>
              :
              !biometricRunning &&
              <Button
                variant="outline"
                onClick={() => {
                  console.log("🚪 Closing scanner modal...");
                  handleInit();
                  // handleShutdown(() => handleInit());
                }}
              >
                Initialize
              </Button>
            }

            {fingerImages.length == 3 && <Button
              variant="outline"
              onClick={() => handleUpload()}
            >
              Save
            </Button>}
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

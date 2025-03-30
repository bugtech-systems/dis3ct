'use client';

import React, { useRef, useState, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Button } from "./ui/button";
import { useComponent } from "./providers/ComponentContext";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Delete } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";


const CamScreen = ({ camType }: any) => {
    const { record, setModal, setRefreshId, setRecord, setTab } = useComponent();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [faceapi, setFaceapi] = useState(null);
    const [mediaStream, setMediaStream] = useState(null);
    const [capturedImages, setCapturedImages] = useState([]);
    const [capturedImage, setCapturedImage] = useState(null);
    const [viewing, setViewing] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [detection, setDetection] = useState(null);
    const [faceDetectionInterval, setFaceDetectionInterval] = useState(null);
    const [borderColor, setBorderColor] = useState('transparent');
    const [uploadType, setUploadType] = useState('capture');

    useEffect(() => {
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
            if (faceDetectionInterval) {
                clearInterval(faceDetectionInterval);
            }
        };
    }, [mediaStream, faceDetectionInterval]);

    useEffect(() => {
        if (record?.tags && !capturedImage) {
            const imagesTag = record.tags
                .filter(img => img.tagType === 'image')
                .map(img => img.value);
            setCapturedImages(imagesTag);
            // setViewing(imagesTag.length > 0);
        }
        if (camType == 'scanner') {
            setViewing(false)
            setTab('basic')
        }

    }, [record, viewing, camType]);

    useEffect(() => {
        loadModels();
    }, []);

    useEffect(() => {
        loadModels();
    }, [camType]);

    useEffect(() => {
        if (!viewing && modelsLoaded) {
            enableVideoStream();
        }
    }, [viewing, modelsLoaded]);

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

    const enableVideoStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setMediaStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    if (modelsLoaded) detectFaces();
                };
            }
        } catch (error) {
            console.error("Error accessing webcam:", error);
        }
    };

    const detectFaces = async () => {
        if (!videoRef.current || !modelsLoaded) return;
        if (uploadType != 'capture' && camType == 'image') return;
        setDetection(null)
        const options = new faceapi.TinyFaceDetectorOptions();
        const interval = setInterval(async () => {
            try {
                if (!videoRef.current || videoRef.current.readyState !== 4) return;
                const detections = await faceapi.detectAllFaces(videoRef.current, options)
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                if (detections.length > 0) {
                    setBorderColor('green');
                } else {
                    setBorderColor('red');
                }


                if (camType == 'scanner' && uploadType == 'capture') {
                    if (detections.length > 0) {
                        setDetection(detections[0]);
                    } else {
                        setDetection(null)
                    }
                }


            } catch (error) {
                console.error("Face detection error:", error);
            }
        }, 2000);

        return () => clearInterval(interval);
    };


    const captureImage = async () => {
        const options = new faceapi.TinyFaceDetectorOptions();

        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext("2d");
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageDataUrl = canvas.toDataURL("image/png");
            setCapturedImage(imageDataUrl);
            if (!videoRef.current || videoRef.current.readyState !== 4) return;
            const detections = await faceapi.detectAllFaces(videoRef.current, options)
                .withFaceLandmarks()
                .withFaceDescriptors();


            if (detections.length > 0) {
                setDetection(detections[0]);
                setBorderColor('green');
            } else {
                setBorderColor('red');
                setDetection(null)
            }


        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        const options = new faceapi.TinyFaceDetectorOptions();

        if (file) {
            setUploadType('file');
            const img = await faceapi.bufferToImage(file);
            const canvas = faceapi.createCanvasFromMedia(img);
            // document.body.append(canvas);
            setDetection(null)
            const displaySize = { width: img.width, height: img.height };
            faceapi.matchDimensions(canvas, displaySize);

            const detections = await faceapi.detectAllFaces(img, options)
                .withFaceLandmarks()
                .withFaceDescriptors();


            if (detections.length > 0) {
                setDetection(detections[0]);
                setBorderColor('green');
                if (camType == 'scanner') {
                    setViewing(true)
                }
            } else {
                setBorderColor('red');
                setDetection(null)
            }


            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result);

            };
            reader.readAsDataURL(file);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await axios.delete(`/api/contacts/${record._id}/tag`, {
                data: { value: id, tagType: 'image' }
            });


            let newTags = capturedImages.filter(img => img != id);

            // setCapturedImages(newTags)
            setRefreshId(Math.random())
            setModal(null)
        } catch (error) {
            console.error("Error deleting image:", error);
        }
    };

    const matchImage = async (id) => {
        try {
            let newMatch = await axios.post(`/api/contacts/match`, { descriptor: detection?.descriptor });

            // let newTags = capturedImages.filter(img => img != id);
            // setCapturedImages(newTags)
            if (newMatch.data) {
                let { match, message, data } = newMatch.data;
                if (match) {
                    handleRecord(data)
                    toast.success(message)
                } else {
                    toast.error(message)
                }


            }

        } catch (error) {

            toast.error('No Face Match')
            setBorderColor('red')
            console.error("Error deleting image:", error);
        }
    };


    const handleRecord = async (data) => {
        // setModal(null)
        if (data) {
            setTab('basic')
            setRecord(data)
            setModal('viewContact', data._id)
            // setFingerPrintId(finger.id)
        }
    }



    const uploadImage = async () => {
        if (!capturedImage) return;

        setUploading(true);
        try {
            const blob = await fetch(capturedImage).then(res => res.blob());
            const formData = new FormData();
            formData.append("file", blob, "image.png");

            const response = await fetch(`/api/contacts/${record._id}/upload`, {
                method: "POST",
                body: formData,
            });


            await axios.post(`/api/contacts/${record._id}/face/save`, { descriptor: detection?.descriptor });
            const data = await response.json();
            if (data.url) {
                let newImgs = [data.url, ...capturedImages]
                setDetection(null)
                setCapturedImages(newImgs)
                setViewing(!viewing)
                setRefreshId(Math.random())
                setModal(null)
            }
            if (!response.ok) throw new Error(data.message || "Failed to upload");
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setUploading(false);
        }
    };


    return (
        <div className="flex flex-col items-center space-y-4">
            {camType == 'image' ?
                <>
                    {viewing ? (
                        <div className="w-full max-w-xs">
                            <Carousel className="w-full max-w-xs">
                                <CarouselContent>
                                    {capturedImages.map((image, index) => (
                                        <CarouselItem key={index}>
                                            <Delete
                                                size={15}
                                                className="float-end cursor-pointer"
                                                onClick={() => handleDelete(image)}
                                            />
                                            <img src={image} alt={`Captured ${index + 1}`} className="w-full rounded-lg shadow" />
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious />
                                <CarouselNext />
                            </Carousel>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center space-y-4">
                            {capturedImage ?
                                <div className="w-full rounded-lg" style={{ border: `5px solid ${borderColor}` }}>
                                    <img src={capturedImage} alt={`Captured `} className="w-full rounded-lg shadow" />
                                </div>
                                :
                                <>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" onClick={() => { setUploadType('file'); setDetection(null) }} />
                                    <div className="w-full rounded-lg" style={{ border: `5px solid ${borderColor}` }}>
                                        <video ref={videoRef} autoPlay className="w-full max-w-sm rounded-sm shadow" />
                                    </div>
                                    <Button onClick={captureImage} className="mt-4">Capture</Button>
                                </>
                            }
                        </div>
                    )}
                    <div className="flex space-x-4">

                        {!viewing && <Button variant="outline" onClick={() => {
                            setCapturedImage(null);

                            setViewing(!viewing)
                            setDetection(null)
                            setUploadType('capture')
                        }}>
                            List
                        </Button>
                        }
                        {(viewing || capturedImage) && <Button variant="outline" onClick={() => {
                            if (capturedImages[0]) {
                                handleDelete(capturedImages[0])
                            }
                            setViewing(!viewing)
                            setCapturedImage(null);
                            setDetection(null)
                            setUploadType('capture')

                        }}>
                            {capturedImages[0] ? "Recapture Image" : "Take Image"}
                        </Button>
                        }

                        {!viewing && (
                            <Button onClick={uploadImage} disabled={uploading || !capturedImage || !detection}>
                                {uploading ? "Uploading..." : "Save"}
                            </Button>
                        )}
                    </div>
                </>
                :
                <>
                    <div className="flex flex-col items-center space-y-4">
                        <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />

                        <div className="w-full rounded-lg" style={{ border: `5px solid ${borderColor}` }}>
                            {capturedImage ?
                                <img src={capturedImage} alt={`Captured `} className="w-full rounded-lg shadow" />
                                :
                                <video ref={videoRef} autoPlay className="w-full max-w-sm rounded-lg shadow" />
                            }
                        </div>
                        {capturedImage && <Button variant="outline" onClick={() => {
                            setCapturedImage(null);
                            setViewing(!viewing)
                            setDetection(null)
                            setUploadType('capture')
                        }}>
                            Remove Image
                        </Button>}
                        <Button onClick={matchImage} className="mt-4">MATCH</Button>
                    </div>
                </>
            }
            <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
    );
};

export default CamScreen;

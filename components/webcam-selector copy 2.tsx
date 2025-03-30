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

const CamScreen = () => {
    const { record } = useComponent();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [faceapi, setFaceapi] = useState(null);
    const [mediaStream, setMediaStream] = useState(null);
    const [capturedImages, setCapturedImages] = useState([]);
    const [capturedImage, setCapturedImage] = useState(null);
    const [viewing, setViewing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [detection, setDetection] = useState(null);
    const [faceDetectionInterval, setFaceDetectionInterval] = useState(null);
    const [descriptor, setDescriptor] = useState(null);

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
    }, [record]);

    useEffect(() => {
        loadModels();
    }, []);

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

        const options = new faceapi.TinyFaceDetectorOptions();
        const interval = setInterval(async () => {
            try {
                if (!videoRef.current || videoRef.current.readyState !== 4) return;
                const detections = await faceapi.detectAllFaces(videoRef.current, options)
                    .withFaceLandmarks()
                    .withFaceDescriptors();

                if (detections.length > 0) {
                    console.log("Face detected", detections);
                    if (!capturedImage) {
                        setDetection(detections[0]);
                    }
                }
            } catch (error) {
                console.error("Face detection error:", error);
            }
        }, 2000);

        return () => clearInterval(interval);
    };


    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext("2d");
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageDataUrl = canvas.toDataURL("image/png");
            setCapturedImage(imageDataUrl);
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const img = await faceapi.bufferToImage(file);
            const canvas = faceapi.createCanvasFromMedia(img);
            // document.body.append(canvas);

            const displaySize = { width: img.width, height: img.height };
            faceapi.matchDimensions(canvas, displaySize);

            const detections = await faceapi.detectAllFaces(img)
                .withFaceLandmarks()
                .withFaceDescriptors();

            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result);
                setCapturedImages(prev => [...prev, reader.result]);
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
            setCapturedImages(newTags)

            console.log("Delete response:", response);
        } catch (error) {
            console.error("Error deleting image:", error);
        }
    };

    const matchImage = async (id) => {
        try {
            let newMatch = await axios.post(`/api/contacts/${record._id}/face/match`, { descriptor: detection?.descriptor });

            let newTags = capturedImages.filter(img => img != id);
            setCapturedImages(newTags)

            console.log("Match response:", newMatch);
        } catch (error) {
            console.error("Error deleting image:", error);
        }
    };




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
            console.log(data, 'RESP')
            if (data.url) {
                let newImgs = [data.url, ...capturedImages]
                setDetection(null)
                setCapturedImages(newImgs)
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
                        <img src={capturedImage} alt={`Captured `} className="w-full rounded-lg shadow" />
                        :
                        <>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />
                            <video ref={videoRef} autoPlay className="w-full max-w-sm rounded-lg shadow" />
                            <Button onClick={captureImage} className="mt-4">Capture</Button>
                            <Button onClick={matchImage} className="mt-4">MATCH</Button>
                        </>
                    }
                </div>
            )}
            <div className="flex space-x-4">
                <Button variant="outline" onClick={() => {
                    setCapturedImage(null);
                    setViewing(!viewing)
                }}>
                    {viewing ? "Add Image" : "List"}
                </Button>

                {!viewing && (
                    <Button onClick={uploadImage} disabled={uploading || !capturedImage}>
                        {uploading ? "Uploading..." : "Save"}
                    </Button>
                )}
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
    );
};

export default CamScreen;

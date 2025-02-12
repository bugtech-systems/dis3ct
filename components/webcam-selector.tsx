import React, { useRef, useState, useEffect } from 'react';

const CamScreen = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [mediaStream, setMediaStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);

    useEffect(() => {

        const enableVideoStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                setMediaStream(stream);
            } catch (error) {
                console.error('Error accessing webcam', error);
            }
        };

        if (!capturedImage) {
            enableVideoStream();
        }

    }, [capturedImage]);

    useEffect(() => {
        if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream]);

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageDataUrl = canvas.toDataURL('image/png');
            setCapturedImage(imageDataUrl);
        }
    };

    const retakeImage = () => {
        setCapturedImage(null);
    };

    useEffect(() => {
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach((track) => {
                    track.stop();
                });
            }
        };
    }, [mediaStream]);



    console.log(capturedImage, 'CAPTURED IMAGE')

    return (
        <div>
            {capturedImage ? (
                <div>
                    <img src={capturedImage} alt="Captured" />
                    <button onClick={retakeImage}>Retake Photo</button>
                </div>
            ) : (
                <div>
                    <video ref={videoRef} autoPlay />
                    <button onClick={captureImage}>Capture Photo</button>
                </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default CamScreen;

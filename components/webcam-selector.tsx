'use client';

import { useEffect, useState, useRef } from 'react';

export default function WebcamSelector() {
    const [devices, setDevices] = useState<any>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const videoRef = useRef<any>(null);

    useEffect(() => {
        async function getDevices() {
            const deviceList = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = deviceList.filter(device => device.kind === 'videoinput') as any;
            setDevices(videoDevices);
            if (videoDevices.length > 0) {
                setSelectedDeviceId(videoDevices[0].deviceId);
            }
        }
        getDevices();
    }, []);

    useEffect(() => {
        async function startStream() {
            if (!selectedDeviceId) return;
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: selectedDeviceId } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        }
        startStream();
    }, [selectedDeviceId]);

    return (
        <div className="flex flex-col items-center space-y-4 p-6">
            <h1 className="text-xl font-bold">Webcam Selector</h1>
            <select
                className="p-2 border rounded"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
            >
                {devices.map((device: any) => (
                    <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${devices.indexOf(device) + 1}`}
                    </option>
                ))}
            </select>
            <video ref={videoRef} autoPlay playsInline className="border rounded w-full max-w-md" />
        </div>
    );
}

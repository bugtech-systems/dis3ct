import { io, Socket } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:5000"; // Your Flask backend URL

const socket: Socket = io(SOCKET_SERVER_URL, {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ["websocket"], // Force WebSocket connection
});

socket.on("connect", () => {
    console.log("✅ Connected to WebSocket Server");
});

socket.on("disconnect", () => {
    console.warn("❌ Disconnected from WebSocket Server");
});

export default socket;

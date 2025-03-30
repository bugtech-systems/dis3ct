import { io, Socket } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:5000"; // Your Flask backend URL
let socket: Socket | null = null;

// const socket: Socket = io(SOCKET_SERVER_URL, {
//     reconnection: true,
//     reconnectionAttempts: 5,
//     reconnectionDelay: 1000,
//     transports: ["websocket"], // Force WebSocket connection
// });

// socket.on("connect", () => {
//     console.log("✅ Connected to WebSocket Server");
// });

// socket.on("disconnect", () => {
//     console.warn("❌ Disconnected from WebSocket Server");
// });

export const connectSocket = () => {
    if (!socket) {
        socket = io(SOCKET_SERVER_URL, {
            autoConnect: true,
            reconnection: false,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ["websocket"], // Force WebSocket connection
        });

        socket.on("connect", () => console.log("✅ Connected to WebSocket Server"));
        socket.on("disconnect", () => console.log("❌ Disconnected from WebSocket Server"));
    }

    return socket;
};

export const getSocket = () => {
    return socket;
};

// export default socket;

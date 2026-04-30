import { io } from "socket.io-client";

// In production, this should point to your live backend domain
// In development, it points to the local Express server
const SOCKET_URL = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
    : "http://127.0.0.1:5000";

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
});

socket.on("connect", () => {
    console.log("🟢 Connected to Real-time Enterprise Socket Bridge", socket.id);
});

socket.on("disconnect", () => {
    console.log("🔴 Disconnected from Real-time Bridge");
});

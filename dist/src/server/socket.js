"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
exports.getIO = getIO;
// server/socket.ts
const socket_io_1 = require("socket.io");
let io;
function initSocket(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: ["http://localhost:3000", "http://192.168.100.29:3000"],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    io.on("connection", (socket) => {
        console.log("🔌 Client connected:", socket.id);
        socket.on("disconnect", () => console.log("❌ Disconnected:", socket.id));
    });
}
function getIO() {
    if (!io)
        throw new Error("Socket.io not initialized!");
    return io;
}

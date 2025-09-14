// server/socket.ts
import { Server as IOServer } from "socket.io";
import type { Server } from "http";

let io: IOServer;

export function initSocket(server: Server) {
  io = new IOServer(server, {
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

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

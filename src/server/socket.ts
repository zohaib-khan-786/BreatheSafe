// server/socket.ts
import { Server as IOServer } from "socket.io";
import type { Server } from "http";

let io: IOServer;

// CORS origins: the dashboard runs on the same host/port as the server, so
// allow the configured client URL plus a localhost wildcard (any port) to cover
// dev (3131) and production (3000) without editing code per environment.
function buildCorsOrigins(): string[] {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL;
  const origins = new Set<string>();
  if (configured) origins.add(configured.replace(/\/$/, ""));
  // localhost wildcard — any port on 127.x / localhost
  origins.add("http://localhost:*");
  origins.add("http://127.0.0.1:*");
  return [...origins];
}

export function initSocket(server: Server) {
  io = new IOServer(server, {
    cors: {
      origin: true,
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

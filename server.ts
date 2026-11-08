// server.ts
// CommonJS module style — required for ts-node dev server compatibility.
const express = require("express");
const next = require("next");
const http = require("http");
const { prisma, disconnectPrisma } = require("./src/lib/prisma");
const { initSocket, getIO } = require("./src/server/socket");
const { validateReading, sanitizeReading } = require("./src/lib/readingValidator");
const { ingestionLimiter } = require("./src/lib/rateLimit");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// ---------------------------------------------------------------------------
// Robustness: graceful shutdown wiring
// ---------------------------------------------------------------------------
let shuttingDown = false;
let httpServer: ReturnType<typeof http.createServer> | null = null;

function gracefulShutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n🛑 Received ${signal} — shutting down gracefully`);

  // Stop accepting new socket connections
  try {
    getIO().close(() => console.log("✅ Socket.io closed"));
  } catch {
    // socket.io may not be initialized yet
  }

  // Close HTTP server
  if (httpServer) {
    httpServer.close(async () => {
      console.log("✅ HTTP server closed");
      try {
        await prisma.$disconnect();
        console.log("✅ Prisma disconnected");
      } catch (e) {
        console.error("Prisma disconnect error:", e);
      }
      process.exit(0);
    });
  }

  // Hard timeout — force exit if graceful shutdown stalls
  setTimeout(() => {
    console.error("❌ Forced exit after graceful shutdown timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Never let an uncaught exception (e.g. EADDRINUSE) silently kill the
// process without logging — a supervisor needs the log to restart.
process.on("uncaughtException", (err: Error) => {
  console.error("❌ Uncaught exception:", err);
  gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason: unknown) => {
  console.error("❌ Unhandled rejection:", reason);
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
app.prepare().then(() => {
  console.log("[server] Next.js ready");
  const server = express();
  httpServer = http.createServer(server);

  // init socket.io
  initSocket(httpServer);

  // ---- Body parsing -------------------------------------------------------
  // ESP posts JSON. Be lenient but never crash the process on a bad payload.
  server.use(
    "/api/socket",
    express.json({
      limit: "64kb", // sensor payloads are small; cap to prevent DoS
    })
  );

  // ---- Sensor ingestion endpoint ------------------------------------------
  // ESP32 posts every N seconds. This route must be fast, idempotent, and
  // never throw — it is the single source of truth for live readings.
  server.post("/api/socket", async (req: any, res: any) => {
    try {
      // Rate limit by client IP so a runaway/spoofed sender can't hammer the DB.
      const clientIp = req.socket.remoteAddress || "unknown";
      if (!ingestionLimiter.allow(clientIp)) {
        return res.status(429).json({ error: "Too many requests" });
      }

      const body = req.body;

      // Validate + sanitize the incoming payload
      const sanitized = validateReading(body);
      if (!sanitized.ok) {
        return res.status(400).json({ error: sanitized.error });
      }
      const data = sanitized.value;

      // Persist to DB (best-effort: a DB hiccup must not drop the live feed)
      let saved: any;
      try {
        saved = await prisma.sensorReading.create({
          data: sanitizeReading(data),
        });
      } catch (dbErr) {
        console.error("DB write failed (continuing live feed):", dbErr);
      }

      // Broadcast to all connected dashboards
      const io = getIO();
      io.emit("newReading", {
        id: saved?.id,
        timestamp: saved?.timestamp ?? new Date().toISOString(),
        ...data,
      });

      res.status(200).json({ success: true, id: saved?.id });
    } catch (err) {
      console.error("API error:", err);
      res.status(500).json({ error: "Failed to save reading" });
    }
  });

  // ---- Health check -------------------------------------------------------
  server.get("/health", async (_req: any, res: any) => {
    try {
      // SQLite: a cheap read proves the connection is alive.
      await prisma.$queryRawUnsafe("SELECT 1");
      res.json({ status: "ok", db: "connected" });
    } catch (e) {
      res.status(503).json({ status: "degraded", db: "disconnected" });
    }
  });

  // let Next handle all other routes
  server.all("/*", (req: any, res: any) => handle(req, res));

  const PORT = Number(process.env.PORT) || 3131;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  });
}).catch((err: unknown) => {
  console.error("[server] Next.js prepare failed:", err);
  process.exit(1);
});
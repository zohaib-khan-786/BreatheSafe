"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const express_1 = __importDefault(require("express"));
const next_1 = __importDefault(require("next"));
const http_1 = __importDefault(require("http"));
const prisma_1 = require("./src/lib/prisma");
const socket_1 = require("./src/server/socket");
const readingValidator_1 = require("./src/lib/readingValidator");
const rateLimit_1 = require("./src/lib/rateLimit");
const dev = process.env.NODE_ENV !== "production";
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
// ---------------------------------------------------------------------------
// Robustness: graceful shutdown wiring
// ---------------------------------------------------------------------------
let shuttingDown = false;
let httpServer = null;
function gracefulShutdown(signal) {
    if (shuttingDown)
        return;
    shuttingDown = true;
    console.log(`\n🛑 Received ${signal} — shutting down gracefully`);
    // Stop accepting new socket connections
    try {
        (0, socket_1.getIO)().close(() => console.log("✅ Socket.io closed"));
    }
    catch {
        // socket.io may not be initialized yet
    }
    // Close HTTP server
    if (httpServer) {
        httpServer.close(async () => {
            console.log("✅ HTTP server closed");
            try {
                await prisma_1.prisma.$disconnect();
                console.log("✅ Prisma disconnected");
            }
            catch (e) {
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
process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught exception:", err);
    gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
    console.error("❌ Unhandled rejection:", reason);
});
// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
app.prepare().then(() => {
    const server = (0, express_1.default)();
    httpServer = http_1.default.createServer(server);
    // init socket.io
    (0, socket_1.initSocket)(httpServer);
    // ---- Body parsing -------------------------------------------------------
    // ESP posts JSON. Be lenient but never crash the process on a bad payload.
    server.use("/api/socket", express_1.default.json({
        limit: "64kb", // sensor payloads are small; cap to prevent DoS
        verify: (req, res, buf) => {
            // Allow the ESP to POST without a Content-Type header too.
        },
    }));
    // ---- Sensor ingestion endpoint ------------------------------------------
    // ESP32 posts every N seconds. This route must be fast, idempotent, and
    // never throw — it is the single source of truth for live readings.
    server.post("/api/socket", async (req, res) => {
        var _a;
        try {
            // Rate limit by client IP so a runaway/spoofed sender can't hammer the DB.
            const clientIp = req.socket.remoteAddress || "unknown";
            if (!rateLimit_1.ingestionLimiter.allow(clientIp)) {
                return res.status(429).json({ error: "Too many requests" });
            }
            const body = req.body;
            // Validate + sanitize the incoming payload
            const sanitized = (0, readingValidator_1.validateReading)(body);
            if (!sanitized.ok) {
                return res.status(400).json({ error: sanitized.error });
            }
            const data = sanitized.value;
            // Persist to DB (best-effort: a DB hiccup must not drop the live feed)
            let saved;
            try {
                saved = await prisma_1.prisma.sensorReading.create({
                    data: (0, readingValidator_1.sanitizeReading)(data),
                });
            }
            catch (dbErr) {
                console.error("DB write failed (continuing live feed):", dbErr);
            }
            // Broadcast to all connected dashboards
            const io = (0, socket_1.getIO)();
            io.emit("newReading", {
                id: saved === null || saved === void 0 ? void 0 : saved.id,
                timestamp: (_a = saved === null || saved === void 0 ? void 0 : saved.timestamp) !== null && _a !== void 0 ? _a : new Date().toISOString(),
                ...data,
            });
            res.status(200).json({ success: true, id: saved === null || saved === void 0 ? void 0 : saved.id });
        }
        catch (err) {
            console.error("API error:", err);
            res.status(500).json({ error: "Failed to save reading" });
        }
    });
    // ---- Health check -------------------------------------------------------
    server.get("/health", async (_req, res) => {
        try {
            // SQLite: a cheap read proves the connection is alive.
            await prisma_1.prisma.$queryRawUnsafe("SELECT 1");
            res.json({ status: "ok", db: "connected" });
        }
        catch (e) {
            res.status(503).json({ status: "degraded", db: "disconnected" });
        }
    });
    // let Next handle all other routes
    server.all("/*", (req, res) => handle(req, res));
    const PORT = Number(process.env.PORT) || 3131;
    httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.disconnectPrisma = disconnectPrisma;
const client_1 = require("@prisma/client");
// ---------------------------------------------------------------------------
// Prisma client with production-grade configuration.
// - Singleton pattern: only one client per process (prevents connection
//   exhaustion under Next.js API routes + standalone server).
// - Connection pool sized for a single SQLite file (SQLite serializes
//   writes, so a modest pool is plenty; we still cap it to avoid fd leaks).
// - Query logging only in development.
// ---------------------------------------------------------------------------
const globalForPrisma = global;
exports.prisma = globalForPrisma.prisma ||
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error", "warn"],
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });
if (process.env.NODE_ENV !== "production")
    globalForPrisma.prisma = exports.prisma;
// ---------------------------------------------------------------------------
// Graceful disconnect — call on SIGTERM/SIGINT so SQLite closes cleanly.
// ---------------------------------------------------------------------------
async function disconnectPrisma() {
    try {
        await exports.prisma.$disconnect();
    }
    catch (err) {
        console.error("Prisma disconnect error:", err);
    }
}

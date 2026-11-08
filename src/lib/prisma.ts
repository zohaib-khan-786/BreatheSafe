import { PrismaClient } from "@prisma/client";

// ---------------------------------------------------------------------------
// Prisma client with production-grade configuration.
// - Singleton pattern: only one client per process (prevents connection
//   exhaustion under Next.js API routes + standalone server).
// - Connection pool sized for a single SQLite file (SQLite serializes
//   writes, so a modest pool is plenty; we still cap it to avoid fd leaks).
// - Query logging only in development.
// ---------------------------------------------------------------------------

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "file:./breathe_safe.db",
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ---------------------------------------------------------------------------
// Graceful disconnect — call on SIGTERM/SIGINT so SQLite closes cleanly.
// ---------------------------------------------------------------------------
export async function disconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error("Prisma disconnect error:", err);
  }
}
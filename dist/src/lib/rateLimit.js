"use strict";
// src/lib/rateLimit.ts
// ---------------------------------------------------------------------------
// Sliding-window, in-memory rate limiter for the ingestion + history APIs.
//
// The ESP32 posts every ~2s on a fixed schedule; dashboards poll on user
// interaction. Both need a sane ceiling so a misbehaving client or a spoofed
// payload can't hammer the DB. This is a single-process, non-distributed
// limiter — fine for a single-node BreatheSafe server.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyLimiter = exports.ingestionLimiter = exports.RateLimiter = void 0;
class RateLimiter {
    constructor(options) {
        this.windows = new Map();
        this.options = options;
    }
    /** Returns `true` when the request is allowed. */
    allow(key) {
        const now = Date.now();
        const entry = this.windows.get(key);
        if (!entry || now - entry.firstAt > this.options.windowMs) {
            this.windows.set(key, { count: 1, firstAt: now });
            return true;
        }
        if (entry.count >= this.options.max) {
            return false;
        }
        entry.count++;
        return true;
    }
    /** Prune expired entries so the map doesn't grow unbounded. */
    prune(now = Date.now()) {
        for (const [key, entry] of this.windows.entries()) {
            if (now - entry.firstAt > this.options.windowMs) {
                this.windows.delete(key);
            }
        }
    }
    get size() {
        return this.windows.size;
    }
}
exports.RateLimiter = RateLimiter;
// ESP ingestion: 1 request per 1s minimum (the ESP posts every 2s anyway).
// 30 req / 10s window is generous but stops a runaway client.
exports.ingestionLimiter = new RateLimiter({ windowMs: 10000, max: 30 });
// Dashboard history polling: 60 req / 10s window.
exports.historyLimiter = new RateLimiter({ windowMs: 10000, max: 60 });

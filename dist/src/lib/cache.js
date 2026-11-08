"use strict";
// src/lib/cache.ts
// ---------------------------------------------------------------------------
// Tiny in-memory TTL cache used by the sensor history API.
//
// The ESP posts every 2s, but dashboards only poll the history endpoints on
// user interaction (range/date change). Caching the last N minutes of
// aggregated results cuts DB round-trips dramatically and keeps the charts
// snappy under concurrent users.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.sensorCache = exports.SimpleTTLCache = void 0;
class SimpleTTLCache {
    constructor(defaultTtlMs = 30000) {
        this.store = new Map();
        this.defaultTtlMs = defaultTtlMs;
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value;
    }
    set(key, value, ttlMs) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + (ttlMs !== null && ttlMs !== void 0 ? ttlMs : this.defaultTtlMs),
        });
    }
    clear() {
        this.store.clear();
    }
    get size() {
        return this.store.size;
    }
}
exports.SimpleTTLCache = SimpleTTLCache;
// Shared cache instance for sensor history responses.
exports.sensorCache = new SimpleTTLCache(15000);

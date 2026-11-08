"use strict";
// src/lib/readingValidator.ts
// ---------------------------------------------------------------------------
// Validates + sanitizes the raw JSON payload posted by the ESP32 firmware.
// The ESP sends: co, co2, nh3, alcohol, benzene, smoke, temperature, humidity,
// humidity_source, pressure, aqi, quality, pm1, pm25, pm10, r0,
// firmware_version, uptime, free_heap.
//
// Design goals:
//  - Never throw on bad input (the ingestion path must stay alive).
//  - Clamp numeric values to physically plausible ranges.
//  - Drop unknown/extra fields so the DB schema stays the source of truth.
// ---------------------------------------------------------------------------
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReading = validateReading;
exports.sanitizeReading = sanitizeReading;
// Physically plausible ceilings — anything beyond these is treated as noise.
const LIMITS = {
    co2: { min: 0, max: 5000 },
    nh3: { min: 0, max: 100 },
    alcohol: { min: 0, max: 200 },
    co: { min: 0, max: 100 },
    benzene: { min: 0, max: 10 },
    smoke: { min: 0, max: 500 },
    temperature: { min: -40, max: 85 },
    humidity: { min: 0, max: 100 },
    pressure: { min: 800, max: 1200 },
    pm1: { min: 0, max: 1000 },
    pm25: { min: 0, max: 1000 },
    pm10: { min: 0, max: 1000 },
    aqi: { min: 0, max: 500 },
    r0: { min: 0, max: 1e6 },
    uptime: { min: 0, max: 1e9 },
    free_heap: { min: 0, max: 2 ** 31 - 1 },
};
const NUMERIC_FIELDS = Object.keys(LIMITS);
const STRING_FIELDS = ["quality", "firmware_version", "humidity_source"];
function toNumber(v, key) {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n))
        return 0;
    const { min, max } = LIMITS[key];
    return Math.max(min, Math.min(max, n));
}
function validateReading(body) {
    if (!body || typeof body !== "object") {
        return { ok: false, error: "Invalid payload: expected JSON object" };
    }
    const out = {
        co2: 0, nh3: 0, alcohol: 0, co: 0, benzene: 0, smoke: 0,
        temperature: 0, humidity: 0, pressure: 0, pm1: 0, pm25: 0, pm10: 0,
        aqi: 0, quality: "UNKNOWN",
    };
    // Numeric fields — clamp to plausible ranges, default to 0 on garbage
    for (const f of NUMERIC_FIELDS) {
        out[f] = toNumber(body[f], f);
    }
    // String fields — coerce, trim, cap length
    for (const f of STRING_FIELDS) {
        const s = typeof body[f] === "string" ? body[f].trim() : "";
        out[f] = s.slice(0, 64);
    }
    // quality must be one of the known categories
    const validQuality = new Set([
        "EXCELLENT", "GOOD", "MODERATE", "POOR", "VERY_POOR", "HAZARDOUS", "UNKNOWN",
    ]);
    if (!validQuality.has(out.quality))
        out.quality = "UNKNOWN";
    return { ok: true, value: out };
}
// Map the validated reading to the Prisma create payload.
// NOTE: use Prisma's JS field names, not the DB column names — Prisma
// translates them via @map at the client layer.
function sanitizeReading(r) {
    return {
        co2: r.co2,
        nh3: r.nh3,
        alcohol: r.alcohol,
        co: r.co,
        benzene: r.benzene,
        smoke: r.smoke,
        temperature: r.temperature,
        humidity: r.humidity,
        pressure: r.pressure,
        pm1: r.pm1,
        pm25: r.pm25,
        pm10: r.pm10,
        humiditySource: r.humidity_source || null,
        r0: r.r0,
        firmwareVersion: r.firmware_version || null,
        uptime: r.uptime,
        freeHeap: r.free_heap,
    };
}

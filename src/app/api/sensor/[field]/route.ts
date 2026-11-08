// app/api/sensor/[field]/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sensorCache } from "@/lib/cache";
import { historyLimiter } from "@/lib/rateLimit";

// Allowed fields — must stay in sync with the Prisma SensorReading model.
const validFields = [
  "co2", "nh3", "alcohol", "co", "benzene", "smoke",
  "temperature", "humidity", "pressure",
  "pm1", "pm25", "pm10",
  // ESP v2.1 extended telemetry (API uses snake_case)
  "r0", "humidity_source", "firmware_version", "uptime", "free_heap",
] as const;

// Translate API snake_case field names to Prisma camelCase field names.
function toPrismaField(apiField: string): string {
  switch (apiField) {
    case "humidity_source":
      return "humiditySource";
    case "firmware_version":
      return "firmwareVersion";
    case "free_heap":
      return "freeHeap";
    default:
      return apiField; // already matches Prisma name
  }
}

type Field = typeof validFields[number];

// Enhanced AQI calculation (same as ESP8266 logic)
function calculateAQI(pm25: number | null, pm10: number | null, co_ppm: number | null, smoke_ppm: number | null): number {
  if (pm25 === null && pm10 === null && co_ppm === null && smoke_ppm === null) return 0;

  // Use the same calculation as the ESP8266
  const pm25Component = pm25 !== null ? (pm25 / 35.4) * 100 : 0;
  const pm10Component = pm10 !== null ? (pm10 / 154) * 100 : 0;
  const coComponent = co_ppm !== null ? (co_ppm / 20) * 100 : 0;
  const smokeComponent = smoke_ppm !== null ? (smoke_ppm / 30) * 100 : 0;
  
  return Math.min(300, Math.max(pm25Component, pm10Component, coComponent, smokeComponent));
}

// Air quality assessment (same as ESP8266 logic)
function assessAirQuality(co2_ppm: number | null, pm25: number | null, pm10: number | null, co_ppm: number | null, smoke_ppm: number | null): string {
  let score = 0;
  
  // CO2 scoring
  if (co2_ppm !== null) {
    if (co2_ppm <= 1000) score += 0;
    else if (co2_ppm <= 2000) score += 2;
    else score += 4;
  }
  
  // PM2.5 scoring
  if (pm25 !== null) {
    if (pm25 <= 12) score += 0;
    else if (pm25 <= 35) score += 1;
    else if (pm25 <= 55) score += 2;
    else score += 4;
  }
  
  // PM10 scoring
  if (pm10 !== null) {
    if (pm10 <= 20) score += 0;
    else if (pm10 <= 50) score += 1;
    else if (pm10 <= 100) score += 2;
    else score += 3;
  }
  
  // CO scoring
  if (co_ppm !== null) {
    if (co_ppm <= 10) score += 0;
    else if (co_ppm <= 20) score += 1;
    else score += 3;
  }
  
  // Smoke scoring
  if (smoke_ppm !== null) {
    if (smoke_ppm <= 5) score += 0;
    else if (smoke_ppm <= 15) score += 1;
    else if (smoke_ppm <= 30) score += 2;
    else score += 4;
  }
  
  // Determine overall quality
  if (score <= 1) return "EXCELLENT";
  if (score <= 3) return "GOOD";
  if (score <= 5) return "MODERATE";
  if (score <= 7) return "POOR";
  if (score <= 9) return "VERY_POOR";
  return "HAZARDOUS";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ field: string }> }
) {
  try {
    const field = (await params).field.toLowerCase();

    // Rate limit by client IP — dashboards poll on interaction, not per frame.
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!historyLimiter.allow(clientIp)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Optional date range
    const { searchParams } = new URL(req.url);
    const from = new Date(
      searchParams.get("from") ?? Date.now() - 24 * 60 * 60 * 1000
    );
    const to = new Date(searchParams.get("to") ?? Date.now());

    if (field === "aqi") {
      // AQI endpoint: calculate based on multiple parameters
      const data = await prisma.sensorReading.findMany({
        where: { timestamp: { gte: from, lte: to } },
        orderBy: { timestamp: "asc" },
        select: { 
          timestamp: true, 
          pm25: true, 
          pm10: true, 
          co: true,
          smoke: true
        },
      });

      return NextResponse.json(
        data.map((d) => ({
          time: d.timestamp.toISOString(),
          value: calculateAQI(d.pm25, d.pm10, d.co, d.smoke),
          quality: assessAirQuality(null, d.pm25, d.pm10, d.co, d.smoke)
        }))
      );
    }

    if (field === "quality") {
      // Air quality endpoint: return quality assessment
      const data = await prisma.sensorReading.findMany({
        where: { timestamp: { gte: from, lte: to } },
        orderBy: { timestamp: "asc" },
        select: { 
          timestamp: true,
          co2: true,
          pm25: true, 
          pm10: true, 
          co: true,
          smoke: true
        },
      });

      return NextResponse.json(
        data.map((d) => ({
          time: d.timestamp.toISOString(),
          value: assessAirQuality(d.co2, d.pm25, d.pm10, d.co, d.smoke),
          score: calculateAQI(d.pm25, d.pm10, d.co, d.smoke)
        }))
      );
    }

    // Single field endpoint
    if (!validFields.includes(field as Field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    const prismaField = toPrismaField(field);

    // Cache per (field, from, to) — sensor data is append-only, so a short
    // TTL is safe and cuts DB round-trips under concurrent dashboard polls.
    const cacheKey = `sensor:${field}:${from.toISOString()}:${to.toISOString()}`;
    const cached = sensorCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=30" },
      });
    }

    const data = await prisma.sensorReading.findMany({
      where: { timestamp: { gte: from, lte: to } },
      orderBy: { timestamp: "asc" },
      select: { timestamp: true, [prismaField]: true },
    });

    // Numeric fields return numbers; string fields (source/version) return
    // strings. Charts only use numeric fields, but the API stays generic.
    const isStringField = field === "humidity_source" || field === "firmware_version";
    const payload = data.map((d) => ({
      time: (d.timestamp as Date).toISOString(),
      value: isStringField ? (d[field as Field] as string) : Number(d[field as Field] ?? 0),
    }));

    sensorCache.set(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=30" },
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
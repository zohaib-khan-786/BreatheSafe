// store/airQualityStore.ts
// SensorReading is the canonical shape of a reading emitted by the ESP32
// firmware (v2.1-esp32-oop) and broadcast over socket.io. It mirrors the
// Prisma SensorReading model plus the live-only telemetry fields.
export type SensorReading = {
  id?: number;
  timestamp?: string | Date;
  co2: number;
  nh3: number;
  alcohol: number;
  co: number;
  benzene: number;
  smoke: number;
  temperature: number;
  humidity: number;
  pressure: number;
  pm1: number;
  pm25: number;
  pm10: number;
  aqi: number;
  quality: string;
  // ESP v2.1 extended telemetry
  humidity_source?: string;
  r0?: number;
  firmware_version?: string;
  uptime?: number;
  free_heap?: number;
};
"use client";

import React, { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import Link from "next/link";
import { BiCheck } from "react-icons/bi";
import { CgDanger } from "react-icons/cg";
import { GiCrossMark } from "react-icons/gi";
import { useTheme } from "next-themes";
import { SensorReading } from "@/models/sensors";
import { useSensorStore } from "@/store/sensorStore";

import { io, Socket } from "socket.io-client";

interface Forecast {
  day: string;
  aqi: number;
  category: string;
  confidence: number;
  mainPollutant?: string;
}
interface ServerToClientEvents {
  newReading: (data: SensorReading) => void;
}
// Enhanced AQI category function (matches ESP8266 logic)
const getAQICategory = (aqi: number): string => {
  if (aqi <= 50) return "EXCELLENT";
  if (aqi <= 100) return "GOOD";
  if (aqi <= 150) return "MODERATE";
  if (aqi <= 200) return "POOR";
  if (aqi <= 300) return "VERY_POOR";
  return "HAZARDOUS";
};

// ✅ Replicates the ESP32 AirQualityCalculator. The firmware sums weighted
// penalties from 6 pollutants (CO2, PM2.5, PM10, CO, smoke, NH3) and maps the
// total score to a category. This is what the ESP LCD shows — it is computed
// independently of the AQI number, so the two can disagree.
const assessFromScore = (data: SensorReading): string => {
  let score = 0;
  if (data.co2 <= 800) score += 0;
  else if (data.co2 <= 1000) score += 1;
  else if (data.co2 <= 1500) score += 2;
  else if (data.co2 <= 2000) score += 3;
  else score += 5;

  if (data.pm25 <= 12) score += 0;
  else if (data.pm25 <= 25) score += 1;
  else if (data.pm25 <= 35) score += 2;
  else if (data.pm25 <= 55) score += 3;
  else score += 5;

  if (data.pm10 <= 20) score += 0;
  else if (data.pm10 <= 50) score += 1;
  else if (data.pm10 <= 100) score += 2;
  else if (data.pm10 <= 150) score += 3;
  else score += 4;

  if (data.co <= 9) score += 0;
  else if (data.co <= 20) score += 2;
  else if (data.co <= 35) score += 3;
  else score += 5;

  if (data.smoke <= 5) score += 0;
  else if (data.smoke <= 15) score += 1;
  else if (data.smoke <= 30) score += 3;
  else score += 4;

  if (data.nh3 <= 25) score += 0;
  else if (data.nh3 <= 50) score += 1;
  else score += 2;

  if (score <= 1) return "EXCELLENT";
  if (score <= 4) return "GOOD";
  if (score <= 8) return "MODERATE";
  if (score <= 12) return "POOR";
  if (score <= 16) return "VERY_POOR";
  return "HAZARDOUS";
};

// Color mapping for AQI categories
const aqiColors: Record<string, string> = {
  "EXCELLENT": "#22c55e",    // Green
  "GOOD": "#eab308",         // Yellow
  "MODERATE": "#f97316",     // Orange
  "POOR": "#ef4444",         // Red
  "VERY_POOR": "#8b5cf6",    // Purple
  "HAZARDOUS": "#7e22ce"     // Deep Purple
};

// Get advice based on AQI category
const getAQIAdvice = (category: string) => {
  switch (category) {
    case "EXCELLENT":
      return "Air quality is excellent. Perfect for outdoor activities!";
    case "GOOD":
      return "Air quality is good. Enjoy outdoor activities!";
    case "MODERATE":
      return "Moderate air quality. Sensitive groups should take caution.";
    case "POOR":
      return "Poor air quality. Limit prolonged outdoor exertion.";
    case "VERY_POOR":
      return "Very poor air quality. Avoid outdoor activities if possible.";
    case "HAZARDOUS":
      return "Hazardous air quality. Stay indoors with windows closed.";
    default:
      return "Air quality data unavailable.";
  }
};

// Get icon based on AQI category
const getAQIIcon = (category: string) => {
  switch (category) {
    case "EXCELLENT":
      return <BiCheck className="bg-green-500 rounded-full text-white p-1" size={24} />;
    case "GOOD":
      return <BiCheck className="bg-yellow-500 rounded-full text-white p-1" size={24} />;
    case "MODERATE":
      return <CgDanger className="bg-orange-500 rounded-full text-white p-1" size={24} />;
    case "POOR":
      return <GiCrossMark className="bg-red-500 rounded-full text-white p-1" size={24} />;
    case "VERY_POOR":
      return <GiCrossMark className="bg-purple-500 rounded-full text-white p-1" size={24} />;
    case "HAZARDOUS":
      return <GiCrossMark className="bg-purple-700 rounded-full text-white p-1" size={24} />;
    default:
      return <CgDanger className="bg-gray-500 rounded-full text-white p-1" size={24} />;
  }
};

let socket: Socket<ServerToClientEvents> | null = null;

// Format seconds into a human-readable uptime string
function formatUptime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "—";
  const s = Math.floor(totalSeconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export default function Dashboard() {
  const { theme } = useTheme();
  const { addReading } = useSensorStore();
  const color = theme === "dark" ? "#fff" : "#000";

  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [forecast, setForecast] = useState<Forecast[]>([]);

  // Socket.io connection
  useEffect(() => {
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket?.id, "URL:", process.env.NEXT_PUBLIC_SOCKET_URL);
      // Debug: log when newReading arrives
      socket.on("newReading", (data: SensorReading) => {
        console.log("📡 Received newReading:", {
          timestamp: data.timestamp,
          aqi: data.aqi,
          quality: data.quality,
          r0: data.r0,
          firmware: data.firmware_version,
          uptime: data.uptime
        });
        setLatest(data);
        addReading(data);
      });
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      socket.on("newReading", (data: SensorReading) => {
        setLatest(data);
        addReading(data);
      });
    }

    return () => {
      socket?.off("newReading");
    };
  }, [addReading]);

  // Fetch 3-day forecast dynamically
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await fetch("/api/airquality/forecast");
        if (!res.ok) throw new Error("Failed to fetch forecast");
        const json: Forecast[] = await res.json();
        setForecast(json);
      } catch (err) {
        console.error("Forecast fetch error:", err);
        // Fallback forecast
        setForecast([
          {
            day: "Tomorrow",
            aqi: 45,
            category: "EXCELLENT",
            confidence: 75,
            mainPollutant: "PM2.5"
          },
          {
            day: new Date(Date.now() + 2 * 86400000).toLocaleDateString('en-US', { weekday: 'long' }),
            aqi: 65,
            category: "GOOD",
            confidence: 65,
            mainPollutant: "PM10"
          },
          {
            day: new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-US', { weekday: 'long' }),
            aqi: 85,
            category: "MODERATE",
            confidence: 60,
            mainPollutant: "CO"
          }
        ]);
      }
    };
    fetchForecast();
  }, []);

  const currentAQI = latest?.aqi || 0;
// Prefer the quality reported by the ESP if it exists; otherwise replicate
// the ESP32 weighted-pollutant scoring algorithm (not the AQI band).
const currentCategory = latest?.quality && aqiColors[latest.quality]
  ? latest.quality
  : latest
    ? assessFromScore(latest)
    : getAQICategory(currentAQI);
const currentColor = aqiColors[currentCategory] || "#22c55e";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AQI Gauge */}
        <div className="flex flex-col items-center justify-center bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-lg">
          <div className="w-48 h-48">
            <CircularProgressbar
              value={currentAQI}
              maxValue={300}
              text={`${currentAQI} AQI`}
              styles={buildStyles({
                textColor: color,
                pathColor: currentColor,
                trailColor: theme === "dark" ? "#374151" : "#e5e7eb",
              })}
            />
          </div>
          <p className="mt-4 text-xl font-semibold" style={{ color: currentColor }}>
            {currentCategory}
          </p>
          {latest?.quality && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quality: {latest.quality}
            </p>
          )}
        </div>

        {/* Forecast Section */}
        <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg font-semibold mb-4">3-Day Forecast</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {forecast.length === 0 ? (
              <div className="col-span-3 text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading forecast...</p>
              </div>
            ) : (
              forecast.map((f) => {
                const forecastColor = aqiColors[f.category] || "#22c55e";
                return (
                  <div
                    key={f.day}
                    className="p-4 rounded-xl text-center border-2"
                    style={{ borderColor: forecastColor, backgroundColor: `${forecastColor}20` }}
                  >
                    <p className="font-semibold">{f.day}</p>
                    <p className="text-2xl font-bold" style={{ color: forecastColor }}>
                      {f.aqi}
                    </p>
                    <p className="text-sm font-medium" style={{ color: forecastColor }}>
                      {f.category}
                    </p>
                    {f.mainPollutant && f.mainPollutant !== 'None' && (
                      <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                        Main: {f.mainPollutant}
                      </p>
                    )}
                    <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                      {f.confidence}% confidence
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Plan Your Day */}
      <div className="mt-6 bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Plan Your Day</h2>
        <div className="flex gap-4 items-center p-4 rounded-lg" style={{ backgroundColor: `${currentColor}20` }}>
          {getAQIIcon(currentCategory)}
          <p className="flex-1" style={{ color: currentColor }}>
            {getAQIAdvice(currentCategory)}
          </p>
        </div>
        
        {/* Additional sensor data */}
        {latest && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-gray-500">PM2.5</div>
              <div className="font-semibold">{latest.pm25 || 0} μg/m³</div>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-gray-500">CO₂</div>
              <div className="font-semibold">{latest.co2 ? latest.co2.toFixed(0) : 0} ppm</div>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-gray-500">Temp</div>
              <div className="font-semibold">{latest.temperature ? latest.temperature.toFixed(1) : 0}°C</div>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-gray-500">Humidity</div>
              <div className="font-semibold">{latest.humidity ? latest.humidity.toFixed(0) : 0}%</div>
            </div>
          </div>
        )}

        {/* Device telemetry (ESP v2.1) */}
        {latest && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-gray-500">Sensor R₀</div>
              <div className="font-semibold">{latest.r0 ? latest.r0.toFixed(0) : "—"} Ω</div>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-gray-500">Humidity source</div>
              <div className="font-semibold">{latest.humidity_source || "—"}</div>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-gray-500">Firmware</div>
              <div className="font-semibold">{latest.firmware_version || "—"}</div>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-gray-500">Uptime</div>
              <div className="font-semibold">
                {latest.uptime ? formatUptime(latest.uptime) : "—"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Redirect Button */}
      <div className="mt-6 flex justify-center">
        <Link
          href="/advanced"
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md transition-colors duration-200"
        >
          Go to Advanced Dashboard →
        </Link>
      </div>
    </div>
  );
}
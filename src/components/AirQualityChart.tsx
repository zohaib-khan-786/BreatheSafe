"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSensorStore } from "@/store/sensorStore";  // ⬅️ switched to SensorStore
import { SensorReading } from "@/models/sensors";

type Status = {
  label: string;
  color: string;
};

// ✅ Status logic (prefer ESP quality, fallback to PM + gases)
const qualityToStatus: Record<string, Status> = {
  EXCELLENT: { label: "EXCELLENT", color: "#00e4d4" },
  GOOD:       { label: "GOOD",       color: "#35c8a3" },
  MODERATE:   { label: "MODERATE",   color: "#ffcc00" },
  POOR:       { label: "POOR",       color: "#ff5b5b" },
  VERY_POOR:  { label: "VERY_POOR",  color: "#c30052" },
  HAZARDOUS:  { label: "HAZARDOUS",  color: "#6a0dad" },
};

// ✅ Score-based status matching the ESP32 AirQualityCalculator.
// The firmware sums weighted penalties from 6 pollutants (CO2, PM2.5, PM10,
// CO, smoke, NH3) and maps the total score to a category.
const assessFromScore = (data: SensorReading): Status => {
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

  if (score <= 1) return { label: "EXCELLENT", color: "#00e4d4" };
  if (score <= 4) return { label: "GOOD", color: "#35c8a3" };
  if (score <= 8) return { label: "MODERATE", color: "#ffcc00" };
  if (score <= 12) return { label: "POOR", color: "#ff5b5b" };
  if (score <= 16) return { label: "VERY_POOR", color: "#c30052" };
  return { label: "HAZARDOUS", color: "#6a0dad" };
};

const getStatus = (data: SensorReading): Status => {
  // If ESP provides a quality string, use it directly.
  if (data.quality && qualityToStatus[data.quality]) {
    return qualityToStatus[data.quality];
  }
  // Fallback: replicate the ESP32 weighted-pollutant scoring algorithm.
  return assessFromScore(data);
};

// ✅ Random position generator
const getPosition = (radius: number) => {
  const angle = Math.random() * 2 * Math.PI;
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
};

// ✅ Color by pollutant
const getPollutantColor = (key: string, value: number) => {
  if (key === "co2") {
    if (value <= 600) return "#00e4d4";
    if (value <= 1000) return "#35c8a3";
    if (value <= 1500) return "#ffcc00";
    if (value <= 2000) return "#ff5b5b";
    if (value <= 3000) return "#c30052";
    return "#6a0dad";
  }
  if (key === "pm25") {
    if (value <= 10) return "#00e4d4";
    if (value <= 20) return "#35c8a3";
    if (value <= 25) return "#ffcc00";
    if (value <= 50) return "#ff5b5b";
    if (value <= 75) return "#c30052";
    return "#6a0dad";
  }
  if (key === "pm10") {
    if (value <= 20) return "#00e4d4";
    if (value <= 40) return "#35c8a3";
    if (value <= 50) return "#ffcc00";
    if (value <= 100) return "#ff5b5b";
    if (value <= 150) return "#c30052";
    return "#6a0dad";
  }
  return "#aaa";
};

export default function AirQualityChart() {
  const latest = useSensorStore((s) => s.latest);  // ⬅️ now from SensorStore
  const [positions, setPositions] = useState({
    co2: getPosition(140),
    pm25: getPosition(170),
    pm10: getPosition(200),
  });

  const rearrangePositions = () => {
    setPositions({
      co2: getPosition(140),
      pm25: getPosition(170),
      pm10: getPosition(200),
    });
  };

  if (!latest) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Waiting for sensor data...</p>
      </div>
    );
  }

  const status = getStatus(latest);

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-[400px] h-[400px] rounded-full flex items-center justify-center">
        {/* Outer rings */}
        <div
          className="absolute w-[380px] h-[380px] rounded-full"
          style={{ backgroundColor: `${status.color}20` }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{ backgroundColor: `${status.color}30` }}
        />
        <div
          className="absolute w-[220px] h-[220px] rounded-full"
          style={{ backgroundColor: `${status.color}40` }}
        />

        {/* Center */}
        <div
          onClick={rearrangePositions}
          className="relative z-10 w-[140px] h-[140px] rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg cursor-pointer active:scale-95"
          style={{ backgroundColor: status.color }}
        >
          {status.label}
        </div>

        {/* Indicators */}
        {[
          { key: "co2", value: latest.co2, label: "CO₂", pos: positions.co2 },
          { key: "pm25", value: latest.pm25, label: "PM2.5", pos: positions.pm25 },
          { key: "pm10", value: latest.pm10, label: "PM10", pos: positions.pm10 },
        ].map((item) => (
          <motion.div
            key={item.key}
            className="absolute flex flex-col items-center"
            animate={{ x: item.pos.x, y: item.pos.y }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <span
              className="w-4 h-4 rounded-full mb-1"
              style={{ backgroundColor: getPollutantColor(item.key, item.value) }}
            ></span>
            <p className="text-xl font-bold">{item.value}</p>
            <p className="text-xs">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

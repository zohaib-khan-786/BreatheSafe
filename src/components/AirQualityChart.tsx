"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSensorStore } from "@/store/sensorStore";  // ⬅️ switched to SensorStore
import { SensorReading } from "@/models/sensors";

type Status = {
  label: string;
  color: string;
};

// ✅ Status logic (based on PM + gases)
const getStatus = (data: SensorReading): Status => {
  const { pm25, pm10, co2 } = data;

  if (pm25 <= 10 && pm10 <= 20 && co2 <= 600)
    return { label: "Good", color: "#00e4d4" };
  if (pm25 <= 20 && pm10 <= 40 && co2 <= 1000)
    return { label: "Fair", color: "#35c8a3" };
  if (pm25 <= 25 && pm10 <= 50 && co2 <= 1500)
    return { label: "Moderate", color: "#ffcc00" };
  if (pm25 <= 50 && pm10 <= 100 && co2 <= 2000)
    return { label: "Poor", color: "#ff5b5b" };
  if (pm25 <= 75 && pm10 <= 150 && co2 <= 3000)
    return { label: "Very Poor", color: "#c30052" };
  return { label: "Extremely Poor", color: "#6a0dad" };
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

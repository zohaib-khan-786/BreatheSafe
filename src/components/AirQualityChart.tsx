"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

type AirQualityData = {
  o3: number;
  no2: number;
  pm25: number;
  pm10: number;
};

type Status = {
  label: string;
  color: string;
};

const getStatus = (data: AirQualityData): Status => {
  const { o3, no2, pm25, pm10 } = data;

  if (pm25 <= 10 && pm10 <= 20 && no2 <= 40 && o3 <= 50)
    return { label: "Good", color: "#00e4d4" };
  if (pm25 <= 20 && pm10 <= 40 && no2 <= 90 && o3 <= 100)
    return { label: "Fair", color: "#35c8a3" };
  if (pm25 <= 25 && pm10 <= 50 && no2 <= 120 && o3 <= 130)
    return { label: "Moderate", color: "#ffcc00" };
  if (pm25 <= 50 && pm10 <= 100 && no2 <= 230 && o3 <= 240)
    return { label: "Poor", color: "#ff5b5b" };
  if (pm25 <= 75 && pm10 <= 150 && no2 <= 340 && o3 <= 380)
    return { label: "Very Poor", color: "#c30052" };
  return { label: "Extremely Poor", color: "#6a0dad" };
};

// Utility to generate random angle for positioning
const getPosition = (radius: number) => {
  const angle = Math.random() * 2 * Math.PI;
  return {
    x: radius * Math.cos(angle),
    y: radius * Math.sin(angle),
  };
};

// Get pollutant-specific indicator color
const getPollutantColor = (key: string, value: number) => {
  if (key === "o3") {
    if (value <= 50) return "#00e4d4";
    if (value <= 100) return "#35c8a3";
    if (value <= 130) return "#ffcc00";
    if (value <= 240) return "#ff5b5b";
    if (value <= 380) return "#c30052";
    return "#6a0dad";
  }
  if (key === "no2") {
    if (value <= 40) return "#00e4d4";
    if (value <= 90) return "#35c8a3";
    if (value <= 120) return "#ffcc00";
    if (value <= 230) return "#ff5b5b";
    if (value <= 340) return "#c30052";
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
  const [data, setData] = useState<AirQualityData>({
    o3: 200,
    no2: 65,
    pm25: 10,
    pm10: 2,
  });

  const [positions, setPositions] = useState({
    o3: getPosition(140),
    no2: getPosition(110),
    pm25: getPosition(170),
    pm10: getPosition(200),
  });

  const status = getStatus(data);

  const rearrangePositions = () => {
    setPositions({
      o3: getPosition(140),
      no2: getPosition(110),
      pm25: getPosition(170),
      pm10: getPosition(200),
    });
  };

  useEffect(() => {
    // fetchData();
  }, []);

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-[400px] h-[400px] rounded-full flex items-center justify-center">
        {/* Outer Rings (now color follows status) */}
        <div
          className="absolute w-[380px] h-[380px] rounded-full"
          style={{
            backgroundColor: `${status.color}20`, // translucent fill
          }}
        ></div>
        <div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            backgroundColor: `${status.color}30`,
          }}
        ></div>
        <div
          className="absolute w-[220px] h-[220px] rounded-full"
          style={{
            backgroundColor: `${status.color}40`,
          }}
        ></div>

        {/* Center Status (Clickable) */}
        <div
          onClick={rearrangePositions}
          className="relative z-10 w-[140px] h-[140px] rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg transition-colors cursor-pointer active:scale-95"
          style={{ backgroundColor: status.color }}
        >
          {status.label}
        </div>

        {/* Pollutant Indicators */}
        {[
          { key: "o3", value: data.o3, label: "O₃", pos: positions.o3 },
          { key: "no2", value: data.no2, label: "NO₂", pos: positions.no2 },
          { key: "pm25", value: data.pm25, label: "PM2.5", pos: positions.pm25 },
          { key: "pm10", value: data.pm10, label: "PM10", pos: positions.pm10 },
        ].map((item) => (
          <motion.div
            key={item.key}
            className="absolute flex flex-col items-center "
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

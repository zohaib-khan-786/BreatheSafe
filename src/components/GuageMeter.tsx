"use client";

import React, { useEffect, useState } from "react";
import ReactSpeedometer from "react-d3-speedometer";
import { useTheme } from "next-themes";

type GaugeCardProps = {
  title: string;
  value: number;
  min: number;
  max: number;
  unit: string;
};

const GuageMeter = ({ title, value, min, max, unit }: GaugeCardProps) => {
  const { theme } = useTheme();
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [segmentColors, setSegmentColors] = useState<string[]>(["#00bcd4", "#4caf50", "#cddc39", "#ffeb3b", "#ff9800", "#f44336"]);

  // evenly divide into 6 stops
  const step = (max - min) / 6;
  const stops = Array.from({ length: 7 }, (_, i) => Math.round(min + i * step));
  useEffect(() => {
    setTextColor(theme === "dark" ? "#ffffff" : "#111111");
    setSegmentColors(theme === "dark"
      ? ["#00e4d4", "#35c8a3", "#ffcc00", "#ff5b5b", "#c30052", "#6a0dad"] 
      : ["#00bcd4", "#4caf50", "#cddc39", "#ffeb3b", "#ff9800", "#f44336"]);

      console.log(textColor)
  },[theme]);

  return (
    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl shadow-md flex flex-col items-center">
      <h2 className="text-sm font-semibold mb-2 text-card-dark dark:text-white">{title}</h2>

      <ReactSpeedometer
        value={value}
        minValue={min}
        maxValue={max}
        segments={6}
        needleColor={textColor}
        textColor={textColor}
        currentValueText={`${value} ${unit}`}
        customSegmentStops={stops}
        segmentColors={segmentColors}
        ringWidth={20}
        width={250}
        height={160}
        forceRender
      />
    </div>
  );
};

export default GuageMeter;

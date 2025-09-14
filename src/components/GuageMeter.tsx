"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

type GaugeCardProps = {
  title: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  thresholds?: number[];
  customSegmentColors?: string[];
};

// Default segment colors for air quality (Good to Extremely Poor)
const defaultSegmentColors = [
  "#00FF00", // Good - Green
  "#ADFF2F", // Fair - GreenYellow
  "#FFFF00", // Moderate - Yellow
  "#FFA500", // Poor - Orange
  "#FF4500", // Very Poor - OrangeRed
  "#FF0000"  // Extremely Poor - Red
];

const darkSegmentColors = [
  "#00CC00", // Good - Darker Green
  "#99CC32", // Fair - Darker GreenYellow
  "#CCCC00", // Moderate - Darker Yellow
  "#CC8400", // Poor - Darker Orange
  "#CC3600", // Very Poor - Darker OrangeRed
  "#CC0000"  // Extremely Poor - Darker Red
];

// Simple fallback gauge component
const FallbackGauge = ({ value, min, max, unit, title }: { value: number, min: number, max: number, unit: string, title: string }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="w-48 h-48 flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold">{value.toFixed(1)} {unit}</div>
        <div className="text-sm text-gray-500 mt-1">{title}</div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-green-500 h-2 rounded-full" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {min} - {max} {unit}
        </div>
      </div>
    </div>
  );
};

const GuageMeter = ({ title, value, min, max, unit, thresholds, customSegmentColors }: GaugeCardProps) => {
  const { theme } = useTheme();
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [segmentColors, setSegmentColors] = useState<string[]>(customSegmentColors || defaultSegmentColors);
  const [speedometerError, setSpeedometerError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [SpeedometerComponent, setSpeedometerComponent] = useState<React.ComponentType<any> | null>(null);

  // Calculate stops based on thresholds if provided, otherwise evenly divide
  const stops = thresholds 
    ? [min, ...thresholds, max] 
    : Array.from({ length: 7 }, (_, i) => Math.round(min + i * (max - min) / 6));

  // Determine the number of segments based on thresholds
  const segmentCount = thresholds ? thresholds.length + 1 : 6;

  // Load the speedometer component with retry logic
  useEffect(() => {
    const loadSpeedometer = async () => {
      try {
        const ReactSpeedometer = await import("react-d3-speedometer");
        setSpeedometerComponent(() => ReactSpeedometer.default || ReactSpeedometer);
        setSpeedometerError(false);
      } catch (error) {
        console.error("Failed to load speedometer:", error);
        setSpeedometerError(true);
        
        // Retry after a delay (exponential backoff)
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        }
      }
    };

    loadSpeedometer();
  }, [retryCount]);

  useEffect(() => {
    setTextColor(theme === "dark" ? "#ffffff" : "#111111");
    
    // Adjust segment colors for dark theme if needed
    if (theme === "dark" && !customSegmentColors) {
      setSegmentColors(darkSegmentColors);
    } else if (!customSegmentColors) {
      setSegmentColors(defaultSegmentColors);
    } else {
      setSegmentColors(customSegmentColors);
    }
  }, [theme, customSegmentColors]);

  // If speedometer failed to load and we've exhausted retries, show fallback
  if (speedometerError && retryCount >= 3) {
    return (
      <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl shadow-md flex flex-col items-center">
        <h2 className="text-sm font-semibold mb-2 text-card-dark dark:text-white">{title}</h2>
        <FallbackGauge value={value} min={min} max={max} unit={unit} title={title} />
        {thresholds && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            Thresholds: {thresholds.join(", ")}
          </div>
        )}
      </div>
    );
  }

  // If speedometer is still loading
  if (!SpeedometerComponent) {
    return (
      <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl shadow-md flex flex-col items-center">
        <h2 className="text-sm font-semibold mb-2 text-card-dark dark:text-white">{title}</h2>
        <div className="w-48 h-48 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading gauge...</p>
            {retryCount > 0 && (
              <p className="text-xs text-gray-400">Retry attempt {retryCount}/3</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render the speedometer
  return (
    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-2xl shadow-md flex flex-col items-center">
      <h2 className="text-sm font-semibold mb-2 text-card-dark dark:text-white">{title}</h2>

      <SpeedometerComponent
        value={value}
        minValue={min}
        maxValue={max}
        segments={segmentCount}
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
      
      {/* Display threshold values if provided */}
      {thresholds && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Thresholds: {thresholds.join(", ")}
        </div>
      )}
    </div>
  );
};

export default GuageMeter;
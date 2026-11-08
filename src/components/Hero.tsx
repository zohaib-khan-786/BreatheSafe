"use client";
import { pollutantData } from "@/data/pollutants";
import { useSensorStore } from "@/store/sensorStore"; // Add sensor store for live updates
import PollutantCard from "./PollutantCard";
import AirQualityChart from "./AirQualityChart";
export default function Hero({ quality }: { quality?: string | null }) {
  const qualityColors: Record<string, string> = {
    EXCELLENT: "#22c55e",
    GOOD: "#eab308",
    MODERATE: "#f97316",
    POOR: "#ef4444",
    VERY_POOR: "#8b5cf6",
    HAZARDOUS: "#7e22ce",
  };
  // Only render the badge when the ESP actually reports a known category.
  // "UNKNOWN" is the validator default for missing data — hide it.
  const showBadge = quality && quality !== "UNKNOWN" && qualityColors[quality];
  return (
    <section className="relative">
      {showBadge && (
        <div className="absolute top-4 right-4 bg-surface-light dark:bg-surface-dark px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600">
          <span className="text-sm font-semibold" style={{ color: qualityColors[quality] || "#FFF" }}>
            {quality}
          </span>
        </div>
      )}
      <div className="container mx-auto w-full grid grid-cols-3 gap-5 items-center ">
        <div className="relative flex items-center justify-center">
          <AirQualityChart />
        </div>
        <div className="col-span-2">
          <p className="mb-4">`Pollutant | Index Level {"(based on pollutant concentration in mg/mg3)"}`</p>
          <div className="grid grid-cols-3 grid-rows-2 gap-4">
            {pollutantData.map((item, idx) => (
              <PollutantCard
                key={idx}
                heading={item.heading}
                details={item.details}
                indexes={item.indexes}
                color={item.color}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}  
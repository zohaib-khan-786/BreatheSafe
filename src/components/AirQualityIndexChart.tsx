// components/AirQualityIndexChart.tsx
"use client";

import { useState, useEffect } from "react";
import { FiCalendar, FiDownload } from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";
import { DateRange, RangeKeyDict } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

type DataPoint = { 
  time: string; 
  value: number;
  quality?: string;
  score?: number;
};

type RangeOption = "5m" | "1h" | "6h" | "1d" | "1w" | "1M";

interface ChartCardProps {
  title: string;
  unit: string;
  endpoint: string;
  showQuality?: boolean;
}

// Color mapping for air quality levels
const qualityColors: Record<string, string> = {
  "EXCELLENT": "#00FF00",
  "GOOD": "#ADFF2F",
  "MODERATE": "#FFFF00",
  "POOR": "#FFA500",
  "VERY_POOR": "#FF4500",
  "HAZARDOUS": "#FF0000"
};

export default function AirQualityIndexChart({ 
  title, 
  unit, 
  endpoint, 
  showQuality = true 
}: ChartCardProps) {
  const [range, setRange] = useState<RangeOption>("1d");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // Date range state
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch data from API whenever range or dateRange changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          from: dateRange[0].startDate.toISOString(),
          to: dateRange[0].endDate.toISOString()
        });

        const res = await fetch(`${endpoint}?${params}`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const json: DataPoint[] = await res.json();
        setData(json);
      } catch (err) {
        console.error("API fetch error:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range, endpoint, dateRange]);

  const ranges: RangeOption[] = ["5m", "1h", "6h", "1d", "1w", "1M"];

  const handleDownload = () => {
    const headers = showQuality ? "Time,Value,Quality,Score\n" : "Time,Value\n";
    const csv = data.map((d) => 
      showQuality 
        ? `${d.time},${d.value},${d.quality || ""},${d.score || ""}`
        : `${d.time},${d.value}`
    ).join("\n");
    
    const blob = new Blob([headers + csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_").toLowerCase()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Custom tooltip for AQI with quality information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-3 border border-gray-600 rounded-lg">
          <p className="text-gray-300">{format(new Date(label), "PPpp")}</p>
          <p className="font-semibold" style={{ color: payload[0].color }}>
            {title}: {payload[0].value.toFixed(1)} {unit}
          </p>
          {data.quality && (
            <p className="mt-1" style={{ color: qualityColors[data.quality] || "#FFF" }}>
              Quality: {data.quality}
            </p>
          )}
          {data.score && (
            <p className="text-sm text-gray-400">
              AQI Score: {data.score.toFixed(0)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Format timestamp for X-axis
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return format(date, "HH:mm");
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl mb-4 p-4 shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">{title}</h2>
        <button
          onClick={handleDownload}
          className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-700"
          title="Download CSV"
        >
          <FiDownload />
        </button>
      </div>

      {/* Chart */}
      <div className="h-72">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading data...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af"
                tickFormatter={formatXAxis}
              />
              <YAxis
                stroke="#9ca3af"
                label={{
                  value: unit,
                  angle: -90,
                  position: "insideLeft",
                  fill: "#9ca3af",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={showQuality ? "#22c55e" : "#3b82f6"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              {showQuality && data.some(d => d.quality) && (
                <Legend 
                  formatter={(value) => (
                    <span style={{ color: qualityColors[value] || "#FFF" }}>
                      {value}
                    </span>
                  )}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-gray-400 text-sm mt-2">
        <div className="flex gap-2 flex-wrap">
          <span>Last:</span>
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-1 rounded ${
                range === r 
                  ? "text-green-400 bg-gray-700 font-semibold" 
                  : "hover:text-white hover:bg-gray-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowCalendar((prev) => !prev)}
            className="hover:text-white flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-700"
          >
            {format(dateRange[0].startDate, "MM/dd/yyyy HH:mm")} -{" "}
            {format(dateRange[0].endDate, "MM/dd/yyyy HH:mm")} <FiCalendar />
          </button>

          {showCalendar && (
            <div className="absolute right-0 top-10 z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl">
              <DateRange
                ranges={dateRange}
                onChange={(item: RangeKeyDict) => {
                  setDateRange([
                    {
                      startDate: item.selection.startDate ?? new Date(),
                      endDate: item.selection.endDate ?? new Date(),
                      key: "selection",
                    },
                  ]);
                  setShowCalendar(false);
                }}
                moveRangeOnFirstSelection={false}
                editableDateInputs
                rangeColors={["#10B981"]}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
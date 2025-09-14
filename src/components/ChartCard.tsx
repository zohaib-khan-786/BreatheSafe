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
} from "recharts";
import { DateRange, RangeKeyDict } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css"; // main style
import "react-date-range/dist/theme/default.css";

type DataPoint = { time: string; value: number };
type RangeOption = "5m" | "1h" | "6h" | "1d" | "1w" | "1M";

interface ChartCardProps {
  title: string;
  unit: string;
  endpoint: string; // API endpoint instead of function
}

export default function ChartCard({ title, unit, endpoint }: ChartCardProps) {
  const [range, setRange] = useState<RangeOption>("1d");
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // Date range state
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // default: last 1 day
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${endpoint}?range=${range}&from=${dateRange[0].startDate.toISOString()}&to=${dateRange[0].endDate.toISOString()}`
        );
        const json: DataPoint[] = await res.json();
        setData(json);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range, endpoint, dateRange]);

  const ranges: RangeOption[] = ["5m", "1h", "6h", "1d", "1w", "1M"];


  const handleDownload = () => {
    const csv = data.map((d) => `${d.time},${d.value}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_").toLowerCase()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl mb-4 p-4 shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">{title}</h2>
        <button
          onClick={handleDownload}
          className="text-gray-400 hover:text-white"
          title="Download CSV"
        >
          <FiDownload />
        </button>
      </div>

      {/* Chart */}
    <div className="h-72">
        {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400">
            Loading...
            </div>
        ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
            No data found
            </div>
        ) : (
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis
                stroke="#9ca3af"
                label={{
                    value: unit,
                    angle: -90,
                    position: "insideLeft",
                    fill: "#9ca3af",
                }}
                />
                <Tooltip
                contentStyle={{ backgroundColor: "#111827", border: "none" }}
                labelStyle={{ color: "#d1d5db" }}
                />
                <Line
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={1}
                dot={false}
                />
            </LineChart>
            </ResponsiveContainer>
        )}
        </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-gray-400 text-sm mt-2">
        <div className="flex gap-2">
          <span>Last:</span>
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`${
                range === r ? "text-green-400 font-semibold" : "hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowCalendar((prev) => !prev)}
            className="hover:text-white flex items-center gap-2"
          >
            {format(dateRange[0].startDate, "MM/dd/yyyy HH:mm")} -{" "}
            {format(dateRange[0].endDate, "MM/dd/yyyy HH:mm")} <FiCalendar />
          </button>

          {showCalendar && (
            <div className="absolute right-0 top-8 z-50">
                <DateRange
                    ranges={dateRange}
                    onChange={(item: RangeKeyDict) =>
                        setDateRange([
                        {
                            startDate: item.selection.startDate ?? new Date(),
                            endDate: item.selection.endDate ?? new Date(),
                            key: "selection",
                        },
                        ])
                    }
                    moveRangeOnFirstSelection={false}
                    editableDateInputs
                />  
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

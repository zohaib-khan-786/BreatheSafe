"use client";

import GuageMeterList from "@/components/GuageMeterLists";
import Hero from "@/components/Hero";
import AirQualityIndexChart from "@/components/AirQualityIndexChart";
import ParameterChartList from "@/components/ParameterChartList";
import { BiArrowBack } from "react-icons/bi";
import Link from "next/link";
import ChartCard from "@/components/ChartCard";
import { useSensorStore } from "@/store/sensorStore";
import { SensorReading } from "@/models/sensors";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// ✅ Define server event types
interface ServerToClientEvents {
  newReading: (data: SensorReading) => void;
}


// ✅ Keep socket reference outside component
let socket: Socket<ServerToClientEvents> | null = null;

export default function AdvancedDashboard() {
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { addReading } = useSensorStore();

  useEffect(() => {
    if (!socket) {
      // ✅ assign to global socket (not redeclare)
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket?.id);
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
      });

      socket.on("newReading", (data: SensorReading) => {
        console.log("📡 Advanced Dashboard received:", {
          timestamp: data.timestamp,
          aqi: data.aqi,
          quality: data.quality,
          r0: data.r0,
          firmware: data.firmware_version,
          uptime: data.uptime
        });
        setLatest(data);
        addReading(data);
        setLastUpdated(new Date());
      });
    }

    return () => {
      // ✅ cleanup to prevent duplicate listeners
      socket?.off("newReading");
    };
  }, [addReading]);

  return (
    <section className="w-[95vw] relative mx-auto overflow-hidden px-4">
      <Link href={"/"} about="Simple Dashboard">
        <button className="absolute top-5 left-0 bg-surface-light dark:bg-surface-dark shadow-lg rounded-2xl p-4 text-xl font-extrabold cursor-pointer">
          <BiArrowBack className="cursor-pointer" />
        </button>
      </Link>

      <Hero quality={latest?.quality} />
      <GuageMeterList />
      <ChartCard title="Air Quality Index" unit="AQI" endpoint="/api/sensor/aqi" />
      <ParameterChartList />
    </section>
  );
}

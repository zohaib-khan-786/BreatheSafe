"use client";

import { useEffect, useState } from "react";
import GaugeMeter from "./GuageMeter";

type AirQualityData = {
  o3: number;
  no2: number;
  pm25: number;
  pm10: number;
  humidity: number;
  temperature: number;
};

export default function GuageMeterList() {
  const [data, setData] = useState<AirQualityData>({
    o3: 231,
    no2: 76,
    pm25: 346,
    pm10: 912,
    humidity: 64,
    temperature: 17,
  });

  useEffect(() => {
    // Example: fetch from API
    // fetch("/api/airquality")
    //   .then((res) => res.json())
    //   .then(setData);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-6 mt-12">
      <GaugeMeter title="Ozone" value={data.o3} unit="µg/m³" min={0} max={400} />
      <GaugeMeter title="Humidity" value={data.humidity} unit="%" min={0} max={100} />
      <GaugeMeter title="Temperature" value={data.temperature} unit="°C" min={0} max={50} />
      <GaugeMeter title="Air Pollution PM 2.5" value={data.pm25} unit="µg/m³" min={0} max={500} />
      <GaugeMeter title="Air Pollution PM 10" value={data.pm10} unit="µg/m³" min={0} max={1000} />
      <GaugeMeter title="Nitrogen Dioxide" value={data.no2} unit="µg/m³" min={0} max={400} />
    </div>
  );
}

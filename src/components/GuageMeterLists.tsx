"use client";

import { useSensorStore } from "@/store/sensorStore";
import GaugeMeter from "./GuageMeter";

export default function GuageMeterList() {
  const latest = useSensorStore((s) => s.latest);

  if (!latest) {
    return <p className="text-center text-gray-400 mt-6">Waiting for sensor data...</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-6 mt-12">
      {/* Gas sensors - MQ135 typically detects up to 1000+ ppm for most gases */}
      <GaugeMeter 
        title="CO₂" 
        value={latest.co2} 
        unit="ppm" 
        min={0} 
        max={5000} 
        thresholds={[400, 1000, 2000, 3000, 4000]} // Good, Fair, Moderate, Poor, Very Poor, Extremely Poor
      />
      <GaugeMeter 
        title="NH₃" 
        value={latest.nh3} 
        unit="ppm" 
        min={0} 
        max={100} 
        thresholds={[10, 20, 30, 40, 50]} 
      />
      <GaugeMeter 
        title="Alcohol" 
        value={latest.alcohol} 
        unit="ppm" 
        min={0} 
        max={200} 
        thresholds={[20, 40, 60, 80, 100]} 
      />
      <GaugeMeter 
        title="CO" 
        value={latest.co} 
        unit="ppm" 
        min={0} 
        max={100} 
        thresholds={[5, 10, 20, 35, 50]} // OSHA limits: 35ppm for 8h, 50ppm for 8h is dangerous
      />
      <GaugeMeter 
        title="Benzene" 
        value={latest.benzene} 
        unit="ppm" 
        min={0} 
        max={10} 
        thresholds={[0.5, 1, 2, 5, 8]} // OSHA limit: 1ppm, dangerous above 5ppm
      />
      <GaugeMeter 
        title="Smoke" 
        value={latest.smoke} 
        unit="ppm" 
        min={0} 
        max={500} 
        thresholds={[50, 100, 200, 300, 400]} 
      />
      
      {/* Environmental sensors */}
      <GaugeMeter 
        title="Temperature" 
        value={latest.temperature} 
        unit="°C" 
        min={-10} 
        max={50} 
        thresholds={[10, 20, 30, 40, 45]} // Comfortable range: 18-24°C
      />
      <GaugeMeter 
        title="Humidity" 
        value={latest.humidity} 
        unit="%" 
        min={0} 
        max={100} 
        thresholds={[30, 50, 70, 80, 90]} // Comfortable range: 30-60%
      />
      <GaugeMeter 
        title="Pressure" 
        value={latest.pressure} 
        unit="hPa" 
        min={970} 
        max={1050} 
        thresholds={[990, 1010, 1020, 1030, 1040]} // Normal range: 1013±20 hPa
      />
      
      {/* Particulate Matter sensors */}
      <GaugeMeter
        title="PM1"
        value={latest.pm1}
        unit="µg/m³"
        min={0}
        max={100}
        thresholds={[10, 20, 30, 40, 50]}
      />
      <GaugeMeter
        title="PM 2.5"
        value={latest.pm25}
        unit="µg/m³"
        min={0}
        max={250}
        thresholds={[12, 35, 55, 150, 250]} // Based on EPA standards
      />
      <GaugeMeter
        title="PM 10"
        value={latest.pm10}
        unit="µg/m³"
        min={0}
        max={500}
        thresholds={[54, 154, 254, 354, 424]} // Based on EPA standards
      />

      {/* ESP v2.1 device telemetry */}
      <GaugeMeter
        title="Sensor R₀"
        value={latest.r0 ?? 0}
        unit="Ω"
        min={0}
        max={50000}
        thresholds={[500, 5000, 15000, 30000, 45000]}
      />
      <GaugeMeter
        title="Free Heap"
        value={latest.free_heap ?? 0}
        unit="KB"
        min={0}
        max={300}
        thresholds={[50, 100, 150, 200, 250]}
      />
    </div>
  );
}
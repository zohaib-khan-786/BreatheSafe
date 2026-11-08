import ChartCard from "@/components/ChartCard";

export default function ParameterChartList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ChartCard title="CO₂" unit="ppm" endpoint="/api/sensor/co2" />
      <ChartCard title="NH₃" unit="ppm" endpoint="/api/sensor/nh3" />
      <ChartCard title="Alcohol" unit="ppm" endpoint="/api/sensor/alcohol" />
      <ChartCard title="CO" unit="ppm" endpoint="/api/sensor/co" />
      <ChartCard title="Benzene" unit="ppm" endpoint="/api/sensor/benzene" />
      <ChartCard title="Smoke" unit="ppm" endpoint="/api/sensor/smoke" />
      <ChartCard title="Temperature" unit="°C" endpoint="/api/sensor/temperature" />
      <ChartCard title="Humidity" unit="%" endpoint="/api/sensor/humidity" />
      <ChartCard title="Pressure" unit="hPa" endpoint="/api/sensor/pressure" />
      <ChartCard title="PM 1.0" unit="µg/m³" endpoint="/api/sensor/pm1" />
      <ChartCard title="PM 2.5" unit="µg/m³" endpoint="/api/sensor/pm25" />
      <ChartCard title="PM 10" unit="µg/m³" endpoint="/api/sensor/pm10" />

      {/* ESP v2.1 device telemetry */}
      <ChartCard title="Sensor R₀" unit="Ω" endpoint="/api/sensor/r0" />
      <ChartCard title="Free Heap" unit="KB" endpoint="/api/sensor/free_heap" />
      <ChartCard title="Uptime" unit="s" endpoint="/api/sensor/uptime" />
    </div>
  );
}

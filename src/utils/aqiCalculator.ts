type AQICategory = {
  aqi: number;
  category: string;
  color: string;
};

const pm25Breakpoints = [
  { low: 0, high: 12, aqiLow: 0, aqiHigh: 50, category: "Good", color: "#00e400" },
  { low: 12.1, high: 35.4, aqiLow: 51, aqiHigh: 100, category: "Moderate", color: "#ffff00" },
  { low: 35.5, high: 55.4, aqiLow: 101, aqiHigh: 150, category: "Unhealthy for Sensitive Groups", color: "#ff7e00" },
  { low: 55.5, high: 150.4, aqiLow: 151, aqiHigh: 200, category: "Unhealthy", color: "#ff0000" },
  { low: 150.5, high: 250.4, aqiLow: 201, aqiHigh: 300, category: "Very Unhealthy", color: "#8f3f97" },
  { low: 250.5, high: 500, aqiLow: 301, aqiHigh: 500, category: "Hazardous", color: "#7e0023" },
];

function calcSubIndex(concentration: number, breakpoints: typeof pm25Breakpoints) {
  const bp = breakpoints.find(b => concentration >= b.low && concentration <= b.high);
  if (!bp) return null;

  const { low, high, aqiLow, aqiHigh, category, color } = bp;
  const aqi = ((aqiHigh - aqiLow) / (high - low)) * (concentration - low) + aqiLow;

  return { aqi: Math.round(aqi), category, color };
}

export function calculateAQI(pm25: number): AQICategory {
  const pm25Index = calcSubIndex(pm25, pm25Breakpoints);

  // 👉 Later you can compute for pm10, no2, o3 etc. and take the max
  // const pm10Index = calcSubIndex(pm10, pm10Breakpoints)
  // const o3Index = calcSubIndex(o3, o3Breakpoints)
  // const max = Math.max(pm25Index.aqi, pm10Index.aqi, ...)

  return pm25Index || { aqi: 0, category: "Unknown", color: "#808080" };
}

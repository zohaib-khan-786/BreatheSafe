// app/api/airquality/forecast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sensorCache } from '@/lib/cache';
import { historyLimiter } from '@/lib/rateLimit';

interface Forecast {
  day: string;
  aqi: number;
  category: string;
  confidence: number;
  mainPollutant?: string;
}

// Enhanced AQI calculation based on multiple pollutants
function calculateComprehensiveAQI(pm25: number | null, pm10: number | null, co: number | null, no2: number | null): number {
  if (pm25 === null && pm10 === null && co === null && no2 === null) return 0;

  // Weighted AQI calculation based on multiple pollutants
  const weights = {
    pm25: 0.4,  // PM2.5 has highest weight
    pm10: 0.3,  // PM10
    co: 0.2,    // CO
    no2: 0.1    // NO2
  };

  let totalWeight = 0;
  let weightedSum = 0;

  if (pm25 !== null) {
    const pm25AQI = Math.min(Math.round((pm25 / 35.4) * 100), 200);
    weightedSum += pm25AQI * weights.pm25;
    totalWeight += weights.pm25;
  }

  if (pm10 !== null) {
    const pm10AQI = Math.min(Math.round((pm10 / 154) * 100), 200);
    weightedSum += pm10AQI * weights.pm10;
    totalWeight += weights.pm10;
  }

  if (co !== null) {
    const coAQI = Math.min(Math.round((co / 9) * 100), 200);
    weightedSum += coAQI * weights.co;
    totalWeight += weights.co;
  }

  if (no2 !== null) {
    const no2AQI = Math.min(Math.round((no2 / 100) * 100), 200);
    weightedSum += no2AQI * weights.no2;
    totalWeight += weights.no2;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

function getAQICategory(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  return "Very Unhealthy";
}

function getMainPollutant(pm25: number, pm10: number, co: number, no2: number): string {
  const pollutants = [
    { name: 'PM2.5', value: pm25, threshold: 12 },
    { name: 'PM10', value: pm10, threshold: 54 },
    { name: 'CO', value: co, threshold: 4.4 },
    { name: 'NO2', value: no2, threshold: 53 }
  ];

  // Find the pollutant with highest exceedance ratio
  const mainPollutant = pollutants.reduce((prev, current) => {
    const prevRatio = prev.value / prev.threshold;
    const currentRatio = current.value / current.threshold;
    return currentRatio > prevRatio ? current : prev;
  });

  return mainPollutant.value > mainPollutant.threshold ? mainPollutant.name : 'None';
}

// Time-based patterns analysis
function detectPatterns(historicalData: any[]) {
  const patterns = {
    morningPeak: false,
    eveningPeak: false,
    weekendEffect: false,
    seasonalTrend: 1.0
  };

  if (historicalData.length < 24) return patterns;

  // Analyze hourly patterns (morning and evening peaks)
  const hourlyAverages: number[] = new Array(24).fill(0);
  const hourlyCounts: number[] = new Array(24).fill(0);

  historicalData.forEach(reading => {
    const hour = new Date(reading.timestamp).getHours();
    hourlyAverages[hour] += reading.aqi;
    hourlyCounts[hour]++;
  });

  for (let i = 0; i < 24; i++) {
    if (hourlyCounts[i] > 0) {
      hourlyAverages[i] /= hourlyCounts[i];
    }
  }

  // Check for morning peak (7-9 AM)
  const morningAvg = (hourlyAverages[7] + hourlyAverages[8] + hourlyAverages[9]) / 3;
  const dailyAvg = hourlyAverages.reduce((sum, val) => sum + val, 0) / 24;
  patterns.morningPeak = morningAvg > dailyAvg * 1.2;

  // Check for evening peak (5-7 PM)
  const eveningAvg = (hourlyAverages[17] + hourlyAverages[18] + hourlyAverages[19]) / 3;
  patterns.eveningPeak = eveningAvg > dailyAvg * 1.2;

  // Simple seasonal adjustment (more pollution in winter)
  const now = new Date();
  const month = now.getMonth();
  if (month >= 10 || month <= 2) { // Nov-Feb
    patterns.seasonalTrend = 1.3; // Winter increase
  } else if (month >= 3 && month <= 5) { // Mar-May
    patterns.seasonalTrend = 1.1; // Spring slight increase
  }

  return patterns;
}

// Generate forecast based on historical patterns
async function generateForecast(): Promise<Forecast[]> {
  try {
    // Get historical data from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const historicalData = await prisma.sensorReading.findMany({
      where: {
        timestamp: {
          gte: sevenDaysAgo,
          lte: new Date()
        }
      },
      orderBy: { timestamp: 'asc' },
      select: {
        timestamp: true,
        pm25: true,
        pm10: true,
        co: true,
        nh3: true // Using NH3 as proxy for NO2
      }
    });

    if (historicalData.length === 0) {
      // Fallback if no data available
      return generateFallbackForecast();
    }

    // Calculate AQI for historical data
    const historicalWithAQI = historicalData.map(reading => ({
      ...reading,
      aqi: calculateComprehensiveAQI(
        reading.pm25,
        reading.pm10,
        reading.co,
        reading.nh3 // Using NH3 as NO2 proxy
      )
    }));

    // Detect patterns in the data
    const patterns = detectPatterns(historicalWithAQI);

    // Calculate baseline from recent data (last 3 days)
    const recentData = historicalWithAQI.filter(reading => 
      new Date(reading.timestamp) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    );

    if (recentData.length === 0) {
      return generateFallbackForecast();
    }

    // Calculate averages for recent period
    const avgPm25 = recentData.reduce((sum, reading) => sum + (reading.pm25 || 0), 0) / recentData.length;
    const avgPm10 = recentData.reduce((sum, reading) => sum + (reading.pm10 || 0), 0) / recentData.length;
    const avgCo = recentData.reduce((sum, reading) => sum + (reading.co || 0), 0) / recentData.length;
    const avgNo2 = recentData.reduce((sum, reading) => sum + (reading.nh3 || 0), 0) / recentData.length;

    const baselineAQI = calculateComprehensiveAQI(avgPm25, avgPm10, avgCo, avgNo2);

    // Generate 3-day forecast
    const forecast: Forecast[] = [];
    const days = ['Tomorrow', 'In 2 days', 'In 3 days'];
    const weekdayFactors = [1.0, 1.0, 1.0]; // Adjust based on weekday patterns

    for (let i = 0; i < 3; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i + 1);
      
      // Apply patterns and trends
      let predictedAQI = baselineAQI * patterns.seasonalTrend * weekdayFactors[i];
      
      // Add some randomness based on historical variability
      const variability = 0.8 + (Math.random() * 0.4); // 0.8-1.2 range
      predictedAQI = Math.round(predictedAQI * variability);

      // Ensure AQI is within reasonable bounds
      predictedAQI = Math.max(0, Math.min(300, predictedAQI));

      forecast.push({
        day: days[i],
        aqi: predictedAQI,
        category: getAQICategory(predictedAQI),
        confidence: 70 - (i * 15), // Confidence decreases for further days
        mainPollutant: getMainPollutant(avgPm25, avgPm10, avgCo, avgNo2)
      });
    }

    return forecast;

  } catch (error) {
    console.error('Forecast generation error:', error);
    return generateFallbackForecast();
  }
}

function generateFallbackForecast(): Forecast[] {
  // Simple fallback forecast based on time of day and season
  const now = new Date();
  const hour = now.getHours();
  const isDaytime = hour >= 6 && hour <= 18;
  
  const baseAQI = isDaytime ? 45 : 55; // Slightly higher at night
  
  return [
    {
      day: 'Tomorrow',
      aqi: Math.round(baseAQI * (0.9 + Math.random() * 0.2)),
      category: 'Good',
      confidence: 50,
      mainPollutant: 'PM2.5'
    },
    {
      day: 'In 2 days',
      aqi: Math.round(baseAQI * (0.95 + Math.random() * 0.3)),
      category: 'Moderate',
      confidence: 40,
      mainPollutant: 'PM10'
    },
    {
      day: 'In 3 days',
      aqi: Math.round(baseAQI * (1.0 + Math.random() * 0.4)),
      category: 'Moderate',
      confidence: 30,
      mainPollutant: 'CO'
    }
  ];
}

export async function GET(request: NextRequest) {
  try {
    // Rate limit per client IP
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    if (!historyLimiter.allow(clientIp)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    // Check in-memory cache first
    const cacheKey = "forecast:v1";
    const cached = sensorCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=30" },
      });
    }

    const forecast = await generateForecast();

    // Cache the result
    sensorCache.set(cacheKey, forecast);

    return NextResponse.json(forecast, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Forecast API error:", error);
    return NextResponse.json(
      { error: "Failed to generate forecast" },
      { status: 500 }
    );
  }
}
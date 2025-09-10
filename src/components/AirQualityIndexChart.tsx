'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Define types
interface AQIDataPoint {
  timestamp: string;
  value: number;
  fullDate: string;
}

interface TimeRange {
  label: string;
  value: string;
}

const AirQualityIndexChart: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<string>('1h');
  
  // Time range options
  const timeRanges: TimeRange[] = [
    { label: '1h', value: '1h' },
    { label: '6h', value: '6h' },
    { label: '1d', value: '1d' },
    { label: '1w', value: '1w' },
    { label: '1M', value: '1M' },
  ];

  // Raw input data from the image
  const rawInputData = [
    'Sep 09:18:44',
    'Sep 09:20:00',
    'Sep 09:21:24',
    'Sep 09:22:58',
    'Sep 10:06:23',
    'Sep 10:15:48',
    'Sep 10:04:27',
    'Sep 10:05:47',
    'Sep 10:07:07',
    'Sep 10:08:37',
    'Sep 10:11:16',
    'Sep 10:12:56',
    'Sep 10:14:36',
    'Sep 10:15:55',
    'Sep 10:17:19'
  ];

  // Generate AQI data based on the input timestamps
  const generateAQIData = (): AQIDataPoint[] => {
    return rawInputData.map((timestamp, index) => {
      // Generate realistic AQI values between 30-150 with some pattern
      const baseValue = 50;
      const variation = Math.sin(index / 2) * 30 + (Math.random() * 20 - 10);
      const value = Math.max(30, Math.min(150, Math.round(baseValue + variation)));
      
      return {
        timestamp,
        value,
        fullDate: `2025-09-10 ${timestamp.split(' ')[1]}`
      };
    });
  };

  const aqiData = useMemo(() => generateAQIData(), []);

  // Calculate statistics
  const calculateStats = () => {
    const values = aqiData.map(point => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
    
    return { min, max, avg, current: values[values.length - 1] };
  };

  const stats = calculateStats();

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="text-gray-700">{`Time: ${label}`}</p>
          <p className="font-medium text-blue-600">{`AQI: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  // Format X-axis ticks to show only time
  const formatXAxis = (tickItem: string) => {
    return tickItem.split(' ')[1]; // Return only the time part
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Air Quality Index</h1>
      
      {/* Input data section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">Input:</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-sm">
          {rawInputData.map((timestamp, index) => (
            <div key={index} className="text-gray-600 bg-gray-50 p-1 rounded">
              {timestamp}
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t border-gray-200 my-6"></div>
      
      {/* Chart and controls section */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Time range selector */}
        <div className="flex flex-col">
          <div className="text-sm font-medium mb-2 text-gray-700">Last:</div>
          <div className="flex flex-wrap gap-2">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedRange === range.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSelectedRange(range.value)}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-2 rounded">
            Sep 09:18:44 - Sep 10:17:19
          </div>
          <div className="mt-2 text-xs text-gray-500">
            09/3/2025 16:02 - 10/3/2025 16:02
          </div>
        </div>
        
        {/* Chart visualization */}
        <div className="flex-1">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={aqiData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 200]} 
                  tick={{ fontSize: 12 }}
                  tickCount={6}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6, fill: '#2563eb' }}
                />
                <ReferenceLine y={50} stroke="#10b981" strokeDasharray="3 3" />
                <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="3 3" />
                <ReferenceLine y={150} stroke="#ef4444" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Stats */}
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <span className="text-gray-500">Min: </span>
              <span className="font-medium">{stats.min}</span>
            </div>
            <div>
              <span className="text-gray-500">Avg: </span>
              <span className="font-medium">{stats.avg}</span>
            </div>
            <div>
              <span className="text-gray-500">Max: </span>
              <span className="font-medium">{stats.max}</span>
            </div>
          </div>
        </div>
        
        {/* Current value */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-blue-600">{stats.current}</div>
          <div className="text-sm text-gray-500 mt-1">Current AQI</div>
          <div className="mt-4 text-xs text-gray-500">
            <div className={`px-2 py-1 rounded-full ${
              stats.current <= 50 ? 'bg-green-100 text-green-800' :
              stats.current <= 100 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {stats.current <= 50 ? 'Good' :
               stats.current <= 100 ? 'Moderate' : 'Unhealthy'}
            </div>
          </div>
        </div>
      </div>
      
      {/* AQI scale explanation */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>0-50: Good</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
            <span>51-100: Moderate</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>101-150: Unhealthy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirQualityIndexChart;
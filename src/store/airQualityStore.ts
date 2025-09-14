"use client";

import { SensorReading } from "@/models/sensors";
import { create } from "zustand";

type AirQualityStore = {
  latest: SensorReading | null;
  history: SensorReading[];
  setReading: (reading: SensorReading) => void;
};

export const useAirQualityStore = create<AirQualityStore>((set) => ({
  latest: null,
  history: [],
  setReading: (reading) =>
    set((state) => ({
      latest: reading,
      history: [...state.history, reading].slice(-100), // keep last 100
    })),
}));
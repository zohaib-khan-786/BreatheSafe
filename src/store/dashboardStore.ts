import { create } from "zustand";

interface Reading {
  aqi: number;
  time: string;
}

interface DashboardState {
  readings: Reading[];
  addReading: (reading: Reading) => void;
  clearReadings: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  readings: [],
  addReading: (reading) =>
    set((state) => ({ readings: [...state.readings, reading] })),
  clearReadings: () => set({ readings: [] }),
}));

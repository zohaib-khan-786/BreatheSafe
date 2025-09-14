import { create } from "zustand";
import { SensorReading } from "@/models/sensors";

interface SensorState {
  latest: SensorReading | null;
  history: SensorReading[];
  addReading: (reading: SensorReading) => void;
  reset: () => void;
}

export const useSensorStore = create<SensorState>((set) => ({
  latest: null,
  history: [],
  addReading: (reading) =>
    set((state) => ({
      latest: reading,
      history: [...state.history.slice(-100), reading],
    })),
  reset: () => set({ latest: null, history: [] }),
}));

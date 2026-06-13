export interface ProgressionPoint {
  date: string;
  isoDate: string;
  setCount: number;
  maxWeight: number;
  topReps: number;
  volume: number;
  est1RM: number;
  maxDuration: number;
  totalDistance: number;
  isPr: boolean;
}

export interface WorkoutStats {
  totalSessions: number;
  firstDate: string;
  lastDate: string;
  prCount: number;
  bestWeight: number;
  bestWeightReps: number;
  best1RM: number;
  bestVolume: number;
  bestDuration: number;
  bestDistance: number;
}

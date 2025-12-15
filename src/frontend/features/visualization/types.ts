import type { components } from "@/types/api";

/**
 * Type definitions for simulation entities and playback.
 */

// Use backend-provided enum for entity types; keep only FE-specific state here.
export type SimulationEntityType =
  components["schemas"]["SimulationEntityType"];

export interface ProgressData {
  value: number;
  minValue: number;
  maxValue: number;
}

export interface SimulationEntityState {
  entityId: string;
  entityType: SimulationEntityType;
  x: number;
  y: number;
  angle: number;
  children: SimulationEntityState[];
  name: string | null;
  progress: ProgressData | null; // null = no progress bar
}

export interface ScrollOffset {
  x: number;
  y: number;
}

export interface ScreenSize {
  width: number;
  height: number;
}

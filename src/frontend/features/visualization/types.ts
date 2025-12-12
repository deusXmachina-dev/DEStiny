import type { components } from "@/types/api";

/**
 * Type definitions for simulation entities and playback.
 */

// Use backend-provided enum for entity types; keep only FE-specific state here.
export type SimulationEntityType =
  components["schemas"]["SimulationEntityType"];

export interface SimulationEntityState {
  entityId: string;
  entityType: SimulationEntityType;
  x: number;
  y: number;
  angle: number;
  children: SimulationEntityState[];
  name: string | null;
}

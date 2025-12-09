/**
 * Type definitions for simulation entities and playback.
 */

export type SimulationEntityType = "agv" | "robot" | "box" | "palette" | "human" | "counter" | "grid_node";

export interface SimulationEntityState {
    entityId: string;
    entityType: SimulationEntityType;
    x: number;
    y: number;
    angle: number;
    children: SimulationEntityState[];
}

import type { components } from "@/types/api";

// Frontend playback types now align directly with backend schemas.
export type SimulationEntityType = components["schemas"]["SimulationEntityType"];
export type SimulationMotionSegment = components["schemas"]["MotionSegment"];
export type SimulationRecording = components["schemas"]["SimulationRecording"];

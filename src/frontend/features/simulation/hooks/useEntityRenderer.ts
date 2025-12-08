"use client";

import { useAppMode } from "@/context/AppModeContext";

import { useBuilderEntities } from "./useBuilderEntities";
import { useSimulationEntities } from "./useSimulationEntities";

/**
 * Hook to manage entity rendering for PixiJS simulation.
 * 
 * Must be used within:
 * - A Pixi Application context (because of useTick in internal hooks)
 * - A PlaybackProvider (for playback state)
 * - An AppModeProvider (for mode)
 * - A BuilderProvider (for blueprint in builder mode)
 * 
 * This hook delegates to specific hooks based on the current app mode:
 * - Builder mode: Uses useBuilderEntities to show the blueprint state
 * - Simulation mode: Uses useSimulationEntities to show the simulation engine state
 * 
 * The separation of concerns makes this hook simple and maintainable.
 */
export const useEntityRenderer = () => {
  const { mode } = useAppMode();
  
  // React Hook rules require us to call both hooks unconditionally,
  // but we control their activity via the enabled flag
  const builderEntities = useBuilderEntities();
  const simulationEntities = useSimulationEntities({ 
    enabled: mode === "simulation" 
  });

  return mode === "builder" ? builderEntities : simulationEntities;
};

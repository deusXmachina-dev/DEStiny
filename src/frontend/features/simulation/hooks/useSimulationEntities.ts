"use client";

import { usePlayback } from "@features/playback";
import type { SimulationEntityState } from "@features/visualization";
import { useTick } from "@pixi/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { SimulationEngine } from "../logic/SimulationEngine";

/**
 * Hook to manage the SimulationEngine and derive entities based on playback time.
 *
 * Must be used within:
 * - A Pixi Application context (because of useTick)
 * - A PlaybackProvider (for playback state)
 *
 * This hook encapsulates all the complexity of the simulation engine lifecycle,
 * recording management, and time-based entity derivation.
 */
export const useSimulationEntities = (): SimulationEntityState[] => {
  const { recording, currentTime } = usePlayback();
  const [entities, setEntities] = useState<SimulationEntityState[]>([]);

  // Track the last rendered time to avoid redundant calculations
  const lastRenderedTimeRef = useRef<number | null>(null);

  // Create engine instance when recording changes
  const engine = useMemo(() => {
    if (!recording) {return null;}
    return new SimulationEngine(recording);
  }, [recording]);

  // Reset when recording changes to force recalculation
  useEffect(() => {
    lastRenderedTimeRef.current = null;
  }, [recording]);

  // Use Pixi's tick to read currentTime and compute entities each frame
  useTick(() => {
    if (!engine) {
      if (entities.length > 0) {setEntities([]);}
      return;
    }

    // Skip if time hasn't changed (optimization for paused state)
    if (currentTime === lastRenderedTimeRef.current) {
      return;
    }

    lastRenderedTimeRef.current = currentTime;

    // Derive entities from current time
    const rootEntities = engine.getEntitiesAtTime(currentTime);
    setEntities(rootEntities);
  });

  return entities;
};

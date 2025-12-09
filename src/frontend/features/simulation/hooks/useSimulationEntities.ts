"use client";

import { usePlayback } from "@features/playback";
import type { SimulationEntityState } from "@features/visualization";
import { useTick } from "@pixi/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { SimulationEngine } from "../logic/SimulationEngine";

interface UseSimulationEntitiesOptions {
  enabled: boolean;
}

/**
 * Hook to manage the SimulationEngine and derive entities based on playback time.
 *
 * Must be used within:
 * - A Pixi Application context (because of useTick)
 * - A PlaybackProvider (for playback state)
 *
 * This hook encapsulates all the complexity of the simulation engine lifecycle,
 * recording management, and time-based entity derivation. It only processes
 * updates when enabled is true.
 */
export const useSimulationEntities = ({
  enabled,
}: UseSimulationEntitiesOptions): SimulationEntityState[] => {
  const { recording, currentTime } = usePlayback();
  const [entities, setEntities] = useState<SimulationEntityState[]>([]);

  // Track the last rendered time to avoid redundant calculations
  const lastRenderedTimeRef = useRef<number | null>(null);
  // Flag to force update when recording changes or when re-enabling
  const shouldForceUpdateRef = useRef<boolean>(true);

  // Create engine instance when recording changes
  const engine = useMemo(() => {
    if (!recording) {
      return null;
    }
    return new SimulationEngine(recording);
  }, [recording]);

  // Reset refs when recording changes to force recalculation
  useEffect(() => {
    lastRenderedTimeRef.current = null;
    shouldForceUpdateRef.current = true;
  }, [recording]);

  // Reset refs when enabled status changes (e.g. switching to this mode)
  useEffect(() => {
    if (enabled) {
      lastRenderedTimeRef.current = null;
      shouldForceUpdateRef.current = true;
    }
  }, [enabled]);

  // Use Pixi's tick to read currentTime and compute entities each frame
  useTick(() => {
    if (!enabled) {
      return;
    }

    if (!engine) {
      if (entities.length > 0) {
        setEntities([]);
      }
      return;
    }

    // Skip if time hasn't changed (optimization for paused state)
    // But force update if we just switched modes (enabled) or recording
    if (
      currentTime === lastRenderedTimeRef.current &&
      !shouldForceUpdateRef.current
    ) {
      return;
    }
    lastRenderedTimeRef.current = currentTime;
    shouldForceUpdateRef.current = false;

    // Derive entities from current time
    const rootEntities = engine.getEntitiesAtTime(currentTime);
    setEntities(rootEntities);
  });

  return entities;
};

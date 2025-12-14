"use client";

import { usePlayback } from "@features/playback";
import { useVisualization } from "@features/visualization/hooks/VisualizationContext";
import { useTick } from "@pixi/react";
import { useEffect, useMemo, useRef } from "react";

import { SimulationEngine } from "../logic/SimulationEngine";

/**
 * Hook to manage the SimulationEngine and update entities via EntityManager.
 *
 * Must be used within:
 * - A Pixi Application context (because of useTick)
 * - A PlaybackProvider (for playback state)
 * - A VisualizationProvider (for EntityManager)
 *
 * This hook encapsulates the simulation engine lifecycle and time-based
 * entity derivation. All entity updates are handled imperatively by
 * EntityManager, completely bypassing React re-renders.
 */
export const useSimulationEntities = (): void => {
  const { recording, clock } = usePlayback();
  const { getEntityManager } = useVisualization();

  // Track the last rendered time to avoid redundant calculations
  const lastRenderedTimeRef = useRef<number | null>(null);

  // Create engine instance when recording changes
  const engine = useMemo(() => {
    if (!recording) {
      return null;
    }
    return new SimulationEngine(recording);
  }, [recording]);

  // Reset when recording changes to force recalculation
  useEffect(() => {
    lastRenderedTimeRef.current = null;
  }, [recording]);

  // Use Pixi's tick to read time from clock and update entities each frame
  useTick(() => {
    const entityManager = getEntityManager();

    if (!engine) {
      // Clear entities when no recording
      if (entityManager) {
        entityManager.updateEntities([]);
      }
      return;
    }

    // Get current time from clock (no React state, just a method call)
    const currentTime = clock.getTime();

    // Skip if time hasn't changed (optimization for paused state)
    if (currentTime === lastRenderedTimeRef.current) {
      return;
    }

    lastRenderedTimeRef.current = currentTime;

    // Derive entities from current time and update imperatively
    const newEntities = engine.getEntitiesAtTime(currentTime);
    if (entityManager) {
      entityManager.updateEntities(newEntities);
    }
  });
};

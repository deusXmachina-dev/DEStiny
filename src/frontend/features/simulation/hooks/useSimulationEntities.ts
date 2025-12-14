"use client";

import { usePlayback } from "@features/playback";
import { useVisualization } from "@features/visualization/hooks/VisualizationContext";
import type { SimulationEntityState } from "@features/visualization";
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
  // Cache last entities to avoid recalculation when paused
  const lastEntitiesRef = useRef<SimulationEntityState[] | null>(null);

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
    lastEntitiesRef.current = null;
  }, [recording]);

  // Use Pixi's tick to read time from clock and update entities each frame
  useTick(() => {
    const entityManager = getEntityManager();

    if (!engine) {
      // Clear entities when no recording
      if (entityManager) {
        entityManager.updateEntities([]);
      }
      lastEntitiesRef.current = null;
      return;
    }

    // Get current time from clock (no React state, just a method call)
    const currentTime = clock.getTime();

    // Recalculate entities only if time has changed
    if (currentTime !== lastRenderedTimeRef.current) {
      lastRenderedTimeRef.current = currentTime;
      lastEntitiesRef.current = engine.getEntitiesAtTime(currentTime);
    }

    // Always update entities (even when paused) to ensure they remain visible
    // during resize/pan operations. This does some redundant work (setting
    // position/rotation even when unchanged), but it's necessary to keep entities
    // visible when the scene transforms change.
    if (entityManager && lastEntitiesRef.current !== null) {
      entityManager.updateEntities(lastEntitiesRef.current);
    }
  });
};

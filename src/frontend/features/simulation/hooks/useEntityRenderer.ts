"use client";

import { usePlayback } from "@features/playback";
import { useTick } from "@pixi/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSimulation } from "./SimulationContext";
import { SimulationEngine } from "../logic/SimulationEngine";
import { blueprintToEntityStates } from "../utils";
import type { SimulationEntityState } from "../types";

/**
 * Hook to manage entity rendering for PixiJS simulation.
 * 
 * Must be used within:
 * - A Pixi Application context (because of useTick)
 * - A PlaybackProvider (for playback state)
 * - A SimulationProvider (for mode and blueprint)
 * 
 * This hook reads currentTime from the global playback context and derives
 * entity states using SimulationEngine in simulation mode, or from blueprint
 * in builder mode. The playback ticker (usePlaybackTicker) owns time advancement;
 * this hook is purely reactive.
 */
export const useEntityRenderer = () => {
  const { recording, currentTime } = usePlayback();
  const { mode, blueprint } = useSimulation();
  const [entities, setEntities] = useState<SimulationEntityState[]>([]);

  // Track the last rendered time to avoid redundant calculations
  const lastRenderedTimeRef = useRef<number>(-1);

  // Create engine instance when recording changes
  const engine = useMemo(() => {
    if (!recording) {
      return null;
    }
    return new SimulationEngine(recording);
  }, [recording]);

  // Reset ref when recording changes
  useEffect(() => {
    lastRenderedTimeRef.current = -1;
  }, [recording]);

  // Convert blueprint to entities when in builder mode
  const blueprintEntities = useMemo(() => {
    if (mode === "builder") {
      return blueprintToEntityStates(blueprint);
    }
    return null;
  }, [mode, blueprint]);

  // Use Pixi's tick to read currentTime and compute entities each frame
  useTick(() => {
    // In builder mode, use blueprint entities directly
    if (mode === "builder") {
      if (blueprintEntities) {
        setEntities(blueprintEntities);
      } else {
        setEntities([]);
      }
      return;
    }

    // In simulation mode, use engine
    if (!engine) {
      setEntities([]);
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

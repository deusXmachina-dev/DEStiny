"use client";

import { useBuilder } from "@features/builder";
import { usePlayback } from "@features/playback";
import { useTick } from "@pixi/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAppMode } from "@/context/AppModeContext";

import { SimulationEngine } from "../logic/SimulationEngine";
import type { SimulationEntityState } from "../types";
import { blueprintToEntityStates } from "../utils";

/**
 * Hook to manage entity rendering for PixiJS simulation.
 * 
 * Must be used within:
 * - A Pixi Application context (because of useTick)
 * - A PlaybackProvider (for playback state)
 * - An AppModeProvider (for mode)
 * - A BuilderProvider (for blueprint in builder mode)
 * 
 * This hook reads currentTime from the global playback context and derives
 * entity states using SimulationEngine in simulation mode, or from blueprint
 * in builder mode. The playback ticker (usePlaybackTicker) owns time advancement;
 * this hook is purely reactive.
 */
export const useEntityRenderer = () => {
  const { recording, currentTime } = usePlayback();
  const { mode } = useAppMode();
  const { blueprint } = useBuilder();
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

  // Reset ref when mode changes to force recalculation
  useEffect(() => {
    lastRenderedTimeRef.current = -1;
  }, [mode]);

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
    // But force update if we just switched modes (lastRenderedTimeRef.current === -1)
    if (currentTime === lastRenderedTimeRef.current && lastRenderedTimeRef.current !== -1) {
      return;
    }
    lastRenderedTimeRef.current = currentTime;

    // Derive entities from current time
    const rootEntities = engine.getEntitiesAtTime(currentTime);
    setEntities(rootEntities);
  });

  return entities;
};

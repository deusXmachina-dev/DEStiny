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
  const lastRenderedTimeRef = useRef<number | null>(null);
  // Flag to force update when recording or mode changes
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

  // Reset refs when mode changes to force recalculation
  useEffect(() => {
    lastRenderedTimeRef.current = null;
    shouldForceUpdateRef.current = true;
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
    // But force update if we just switched modes or recording
    if (currentTime === lastRenderedTimeRef.current && !shouldForceUpdateRef.current) {
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

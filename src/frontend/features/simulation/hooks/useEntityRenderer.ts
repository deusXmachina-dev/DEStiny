"use client";

import { usePlayback } from "@features/playback";
import { useTick } from "@pixi/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { SimulationEngine } from "../logic/SimulationEngine";
import type { SimulationEntityState } from "../types";

/**
 * Hook to manage entity rendering for PixiJS simulation.
 * 
 * Must be used within:
 * - A Pixi Application context (because of useTick)
 * - A PlaybackProvider (for playback state)
 * 
 * This hook reads currentTime from the global playback context and derives
 * entity states using SimulationEngine. The playback ticker (usePlaybackTicker)
 * owns time advancement; this hook is purely reactive.
 */
export const useEntityRenderer = () => {
    const { recording, currentTime } = usePlayback();
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

    // Use Pixi's tick to read currentTime and compute entities each frame
    useTick(() => {
        if (!engine) {
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

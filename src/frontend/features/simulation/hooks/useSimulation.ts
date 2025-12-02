import { useTick } from "@pixi/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SimulationEntityState } from "../types";
import { useSimulationController } from "./SimulationContext";
import { SimulationEngine } from "../logic/SimulationEngine";

/**
 * Hook to manage simulation playback.
 * Must be used within a Pixi Application context (because of useTick).
 * Reads state from SimulationContext.
 */
export const useSimulation = () => {
    const { recording, speed, isPlaying, setCurrentTime, seekTarget, clearSeekTarget } = useSimulationController();
    const [entities, setEntities] = useState<SimulationEntityState[]>([]);

    // Playback state
    const accumulatedTimeRef = useRef<number>(0);
    const hasRenderedInitialFrameRef = useRef<boolean>(false);

    // Create engine instance when recording changes
    const engine = useMemo(() => {
        if (!recording) return null;
        return new SimulationEngine(recording);
    }, [recording]);

    // Reset simulation time when recording changes
    useEffect(() => {
        accumulatedTimeRef.current = 0;
        hasRenderedInitialFrameRef.current = false;
        setCurrentTime(0);
    }, [recording, setCurrentTime]);

    // Handle seek target - when user seeks, update accumulated time and clear the seek flag
    useEffect(() => {
        if (seekTarget !== null) {
            accumulatedTimeRef.current = seekTarget * 1000; // Convert to ms
            hasRenderedInitialFrameRef.current = false; // Force re-render
            engine?.resetCache();
            clearSeekTarget();
        }
    }, [seekTarget, clearSeekTarget, engine]);

    useTick((ticker) => {
        if (!engine) return;

        const duration = engine.duration * 1000; // Duration in ms

        // Advance time only when playing
        if (isPlaying) {
            // ticker.deltaMS is the time elapsed since the last frame in milliseconds
            accumulatedTimeRef.current += ticker.deltaMS * speed;

            if (accumulatedTimeRef.current > duration) {
                // Clamp to end
                accumulatedTimeRef.current = duration;
            }
        } else {
            // When paused, only render once (the initial/current frame)
            if (hasRenderedInitialFrameRef.current) return;
            hasRenderedInitialFrameRef.current = true;
        }

        const simTimeSeconds = accumulatedTimeRef.current / 1000;

        // Update context with current time
        setCurrentTime(simTimeSeconds);

        // Delegate entity calculation to the engine
        const rootEntities = engine.getEntitiesAtTime(simTimeSeconds);
        setEntities(rootEntities);
    });

    return entities;
};


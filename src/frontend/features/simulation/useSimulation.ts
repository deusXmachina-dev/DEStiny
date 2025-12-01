import { useTick } from "@pixi/react";
import { useEffect, useRef, useState } from "react";
import { SimulationComponent, SimulationEntityState, SimulationSnapshot } from "./types";
import { useSimulationController } from "./SimulationContext";

/**
 * Linear interpolation helper.
 */
const lerp = (a: number, b: number, t: number) => {
    return a + (b - a) * t;
};

const interpolateEntities = (
    prevComponents: SimulationComponent[],
    nextComponents: SimulationComponent[],
    t: number
): SimulationEntityState[] => {
    const nextEntitiesMap = new Map(nextComponents.map(c => [c.id, c]));
    const result: SimulationEntityState[] = [];

    for (const prevEntity of prevComponents) {
        const nextEntity = nextEntitiesMap.get(prevEntity.id);

        // Recursive step for children
        const nextChildren = nextEntity?.children || [];
        const children = interpolateEntities(prevEntity.children || [], nextChildren, t);

        if (nextEntity) {
            result.push({
                id: prevEntity.id,
                type: prevEntity.type,
                x: lerp(prevEntity.x, nextEntity.x, t),
                y: lerp(prevEntity.y, nextEntity.y, t),
                angle: lerp(prevEntity.angle, nextEntity.angle, t),
                children
            });
        } else {
            // Entity is disappearing. Keep at last known position.
            result.push({
                id: prevEntity.id,
                type: prevEntity.type,
                x: prevEntity.x,
                y: prevEntity.y,
                angle: prevEntity.angle,
                children
            });
        }
    }
    return result;
};

/**
 * Hook to manage simulation playback.
 * Must be used within a Pixi Application context (because of useTick).
 * Reads state from SimulationContext.
 */
export const useSimulation = () => {
    const { history, speed, isPlaying } = useSimulationController();
    const [entities, setEntities] = useState<SimulationEntityState[]>([]);

    // Playback state
    const accumulatedTimeRef = useRef<number>(0);

    // Reset simulation time when history changes
    useEffect(() => {
        accumulatedTimeRef.current = 0;
    }, [history]);

    useTick((ticker) => {
        if (history.length === 0) return;

        // If paused, we don't advance time, but we might still want to render 
        // (though if nothing changed, React might not re-render unless we force it. 
        // But here we are inside useTick which runs every frame).
        // If we just return here when !isPlaying, the simulation freezes, which is correct.
        if (!isPlaying) return;

        const duration = history[history.length - 1].time * 1000; // Duration in ms

        // Advance time
        // ticker.deltaMS is the time elapsed since the last frame in milliseconds
        accumulatedTimeRef.current += ticker.deltaMS * speed;

        let currentSimTime = accumulatedTimeRef.current;

        if (currentSimTime > duration) {
            // Clamp to end
            currentSimTime = duration;
            accumulatedTimeRef.current = duration;
        }

        const simTimeSeconds = currentSimTime / 1000;

        // Find surrounding snapshots
        // Optimization: Could track current index to avoid searching from 0 every time
        let prevIndex = 0;
        for (let i = 0; i < history.length - 1; i++) {
            if (simTimeSeconds >= history[i].time && simTimeSeconds < history[i + 1].time) {
                prevIndex = i;
                break;
            }
        }

        // If we are past the last frame (and not looping or exactly at end), clamp to last
        if (simTimeSeconds >= history[history.length - 1].time) {
            prevIndex = history.length - 1;
        }

        const prevSnapshot = history[prevIndex];
        const nextSnapshot = history[prevIndex + 1] || prevSnapshot;

        // Interpolation factor
        const timeRange = nextSnapshot.time - prevSnapshot.time;
        const t = timeRange > 0
            ? (simTimeSeconds - prevSnapshot.time) / timeRange
            : 0;

        const interpolatedEntities = interpolateEntities(prevSnapshot.components, nextSnapshot.components, t);
        setEntities(interpolatedEntities);
    });

    return entities;
};

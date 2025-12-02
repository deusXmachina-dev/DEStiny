import { useTick } from "@pixi/react";
import { useEffect, useRef, useState } from "react";
import { SimulationEntityState } from "./types";
import { useSimulationController } from "./SimulationContext";

/**
 * Linear interpolation helper.
 */
const lerp = (a: number, b: number, t: number) => {
    return a + (b - a) * t;
};

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
    
    // Cache current segment index for each entity to optimize lookup
    const segmentIndicesRef = useRef<Record<string, number>>({});

    // Reset simulation time and cache when recording changes
    useEffect(() => {
        accumulatedTimeRef.current = 0;
        hasRenderedInitialFrameRef.current = false;
        segmentIndicesRef.current = {};
        setCurrentTime(0);
    }, [recording, setCurrentTime]);

    // Handle seek target - when user seeks, update accumulated time and clear the seek flag
    useEffect(() => {
        if (seekTarget !== null) {
            accumulatedTimeRef.current = seekTarget * 1000; // Convert to ms
            hasRenderedInitialFrameRef.current = false; // Force re-render
            clearSeekTarget();
        }
    }, [seekTarget, clearSeekTarget]);


    useTick((ticker) => {
        if (!recording) return;

        const duration = recording.duration * 1000; // Duration in ms

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

        const currentSimTime = accumulatedTimeRef.current;
        const simTimeSeconds = currentSimTime / 1000;

        // Update context with current time
        setCurrentTime(simTimeSeconds);

        const activeEntities = new Map<string, SimulationEntityState & { parentId: string | null }>();
        const indices = segmentIndicesRef.current;

        // Calculate state for each entity
        Object.entries(recording.segments_by_entity).forEach(([id, segments]) => {
            // segments is now Array<SimulationMotionSegment> directly
            if (!segments || segments.length === 0) return;

            // Get cached index or start at 0
            let index = indices[id] ?? 0;

            // Optimization: "Keep current valid index"
            // 1. If we are past the start of the NEXT segment, move forward
            // (segments are assumed to be sorted by startTime)
            while (index < segments.length - 1 && segments[index + 1].startTime <= simTimeSeconds) {
                index++;
            }

            // 2. If we are before the start of the CURRENT segment (e.g. rewind), move backward
            while (index > 0 && segments[index].startTime > simTimeSeconds) {
                index--;
            }

            // Update cache
            indices[id] = index;

            // 3. Check if the current segment is valid for rendering
            const segment = segments[index];

            // Determine effective end time (null means indefinite, so effectively infinity or max duration)
            const effectiveEndTime = segment.endTime === null ? recording.duration : segment.endTime;

            // Only render if time is within [startTime, effectiveEndTime]
            if (simTimeSeconds >= segment.startTime && simTimeSeconds <= effectiveEndTime) {
                const duration = effectiveEndTime - segment.startTime;
                const t = duration > 0 ? (simTimeSeconds - segment.startTime) / duration : 0;

                activeEntities.set(id, {
                    entityId: id,
                    entityType: segment.entityType,
                    x: lerp(segment.startX, segment.endX, t),
                    y: lerp(segment.startY, segment.endY, t),
                    angle: lerp(segment.startAngle, segment.endAngle, t),
                    children: [],
                    parentId: segment.parentId
                });
            }
        });

        // Reconstruct hierarchy
        const rootEntities: SimulationEntityState[] = [];
        
        activeEntities.forEach((entity) => {
            if (entity.parentId && activeEntities.has(entity.parentId)) {
                // If parent exists in current frame, add as child
                const parent = activeEntities.get(entity.parentId)!;
                parent.children.push(entity);
            } else {
                // If no parent or parent not rendered, add as root
                rootEntities.push(entity);
            }
        });

        setEntities(rootEntities);
    });

    return entities;
};

import type { SimulationRecording } from "@features/playback";

import type { BoundingBox, SimulationEntityState } from "../types";
import { lerp } from "../utils";    

/**
 * SimulationEngine handles the core logic for simulation playback:
 * - Interpolating entity positions between motion segments
 * - Reconstructing parent-child hierarchy
 * - Caching segment indices for performance
 */
export class SimulationEngine {
    private recording: SimulationRecording;
    private segmentIndices: Record<string, number> = {};

    constructor(recording: SimulationRecording) {
        this.recording = recording;
    }

    /**
     * Reset the segment index cache (e.g., when seeking to a different time).
     */
    resetCache(): void {
        this.segmentIndices = {};
    }

    /**
     * Get the duration of the recording in seconds.
     */
    get duration(): number {
        return this.recording.duration;
    }

    /**
     * Calculate the state of all entities at a given time.
     * Returns a tree of root entities with their children attached.
     */
    getEntitiesAtTime(timeSeconds: number): SimulationEntityState[] {
        const activeEntities = new Map<string, SimulationEntityState & { parentId: string | null }>();

        // Calculate state for each entity
        Object.entries(this.recording.segments_by_entity).forEach(([id, segments]) => {
            if (!segments || segments.length === 0) {return;}

            // Get cached index or start at 0
            let index = this.segmentIndices[id] ?? 0;

            // Optimization: Keep current valid index
            // 1. If we are past the start of the NEXT segment, move forward
            while (index < segments.length - 1 && segments[index + 1].startTime <= timeSeconds) {
                index++;
            }

            // 2. If we are before the start of the CURRENT segment (e.g. rewind), move backward
            while (index > 0 && segments[index].startTime > timeSeconds) {
                index--;
            }

            // Update cache
            this.segmentIndices[id] = index;

            // 3. Check if the current segment is valid for rendering
            const segment = segments[index];

            // Determine effective end time (null means indefinite)
            const effectiveEndTime = segment.endTime === null ? this.recording.duration : segment.endTime;

            // Only render if time is within [startTime, effectiveEndTime]
            if (timeSeconds >= segment.startTime && timeSeconds <= effectiveEndTime) {
                const segmentDuration = effectiveEndTime - segment.startTime;
                const t = segmentDuration > 0 ? (timeSeconds - segment.startTime) / segmentDuration : 0;

                activeEntities.set(id, {
                    entityId: id,
                    entityType: segment.entityType,
                    x: lerp(segment.startX, segment.endX, t),
                    y: lerp(segment.startY, segment.endY, t),
                    angle: lerp(segment.startAngle, segment.endAngle, t),
                    children: [],
                    parentId: segment.parentId,
                });
            }
        });

        // Reconstruct hierarchy
        return this.buildHierarchy(activeEntities);
    }

    /**
     * Build the parent-child hierarchy from flat entity map.
     */
    private buildHierarchy(
        activeEntities: Map<string, SimulationEntityState & { parentId: string | null }>
    ): SimulationEntityState[] {
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

        return rootEntities;
    }

    /**
     * Calculate the bounding box of all entities across the entire recording.
     * Returns the min/max x/y coordinates that encompass all entity positions.
     */
    getBoundingBox(): BoundingBox {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        Object.values(this.recording.segments_by_entity).forEach(segments => {
            segments.forEach(seg => {
                minX = Math.min(minX, seg.startX, seg.endX);
                minY = Math.min(minY, seg.startY, seg.endY);
                maxX = Math.max(maxX, seg.startX, seg.endX);
                maxY = Math.max(maxY, seg.startY, seg.endY);
            });
        });

        return { minX, minY, maxX, maxY };
    }
}


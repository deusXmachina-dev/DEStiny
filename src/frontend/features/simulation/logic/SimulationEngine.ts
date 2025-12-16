import type { SimulationRecording } from "@features/playback";
import type { ProgressData, SimulationEntityState } from "@features/visualization";

import { lerp } from "../utils";

/**
 * SimulationEngine handles the core logic for simulation playback:
 * - Interpolating entity positions between motion segments
 * - Reconstructing parent-child hierarchy
 * - Caching segment indices for performance
 * - Calculating progress values from progress segments
 */
export class SimulationEngine {
  private recording: SimulationRecording;
  private segmentIndices: Record<string, number> = {};
  private progressSegmentIndices: Record<string, number> = {};

  constructor(recording: SimulationRecording) {
    this.recording = recording;
  }

  /**
   * Reset the segment index cache (e.g., when seeking to a different time).
   */
  resetCache(): void {
    this.segmentIndices = {};
    this.progressSegmentIndices = {};
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
    Object.entries(this.recording.motion_segments_by_entity).forEach(([id, segments]) => {
      if (!segments || segments.length === 0) {
        return;
      }

      // Get cached index or start at 0
      let index = this.segmentIndices[id] ?? 0;

      // Optimization: Keep current valid index
      // 1. If we are past the start of the NEXT segment, move forward
      while (index < segments.length - 1) {
        const nextSegment = segments[index + 1];
        if (!nextSegment || nextSegment.startTime > timeSeconds) {
          break;
        }
        index++;
      }

      // 2. If we are before the start of the CURRENT segment (e.g. rewind), move backward
      while (index > 0) {
        const currentSegment = segments[index];
        if (!currentSegment || currentSegment.startTime <= timeSeconds) {
          break;
        }
        index--;
      }

      // Update cache
      this.segmentIndices[id] = index;

      // 3. Check if the current segment is valid for rendering
      const segment = segments[index];
      if (!segment) {
        return;
      }

      // Determine effective end time (null means indefinite)
      const effectiveEndTime = segment.endTime ?? segment.startTime + this.recording.duration;

      // Only render if time is within [startTime, effectiveEndTime]
      if (timeSeconds >= segment.startTime && timeSeconds <= effectiveEndTime) {
        const segmentDuration = effectiveEndTime - segment.startTime;
        const t = segmentDuration > 0 ? (timeSeconds - segment.startTime) / segmentDuration : 0;

        const progress = this.getProgressAtTime(id, timeSeconds);

        activeEntities.set(id, {
          entityId: id,
          entityType: segment.entityType,
          x: lerp(segment.startX, segment.endX, t),
          y: lerp(segment.startY, segment.endY, t),
          angle: lerp(segment.startAngle, segment.endAngle, t),
          children: [],
          name: segment.name ?? null,
          parentId: segment.parentId ?? null,
          progress,
        });
      }
    });

    // Reconstruct hierarchy
    return this.buildHierarchy(activeEntities);
  }

  /**
   * Get progress value for an entity at a given time.
   * Returns null if no progress segment exists or is active.
   */
  private getProgressAtTime(entityId: string, timeSeconds: number): ProgressData | null {
    const segments = this.recording.progress_segments_by_entity?.[entityId];
    if (!segments || segments.length === 0) {
      return null;
    }

    // Get cached index or start at 0
    let index = this.progressSegmentIndices[entityId] ?? 0;

    // Optimization: Keep current valid index
    // 1. If we are past the start of the NEXT segment, move forward
    while (index < segments.length - 1) {
      const nextSegment = segments[index + 1];
      if (!nextSegment || nextSegment.start_time > timeSeconds) {
        break;
      }
      index++;
    }

    // 2. If we are before the start of the CURRENT segment (e.g. rewind), move backward
    while (index > 0) {
      const currentSegment = segments[index];
      if (!currentSegment || currentSegment.start_time <= timeSeconds) {
        break;
      }
      index--;
    }

    // Update cache
    this.progressSegmentIndices[entityId] = index;

    // 3. Check if the current segment is valid
    const segment = segments[index];
    if (!segment) {
      return null;
    }

    // Determine effective end time (null means indefinite)
    const effectiveEndTime = segment.end_time ?? segment.start_time + this.recording.duration;

    // Only return progress if time is within [start_time, effectiveEndTime]
    if (timeSeconds < segment.start_time || timeSeconds > effectiveEndTime) {
      return null;
    }

    // Interpolate value
    const segmentDuration = effectiveEndTime - segment.start_time;
    const t = segmentDuration > 0 ? (timeSeconds - segment.start_time) / segmentDuration : 0;

    const interpolatedValue = lerp(segment.start_value, segment.end_value, t);

    return {
      value: interpolatedValue,
      minValue: segment.min_value,
      maxValue: segment.max_value,
    };
  }

  /**
   * Build the parent-child hierarchy from flat entity map.
   */
  private buildHierarchy(
    activeEntities: Map<string, SimulationEntityState & { parentId: string | null }>,
  ): SimulationEntityState[] {
    const rootEntities: SimulationEntityState[] = [];

    activeEntities.forEach((entity) => {
      if (entity.parentId && activeEntities.has(entity.parentId)) {
        // If parent exists in current frame, add as child
        const parent = activeEntities.get(entity.parentId);
        if (parent) {
          parent.children.push(entity);
        } else {
          // Fallback to root if parent somehow doesn't exist
          rootEntities.push(entity);
        }
      } else {
        // If no parent or parent not rendered, add as root
        rootEntities.push(entity);
      }
    });

    return rootEntities;
  }
}

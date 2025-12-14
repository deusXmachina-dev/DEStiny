"use client";

import { usePlayback } from "@features/playback";
import type { SimulationEntityState } from "@features/visualization";
import { useVisualization } from "@features/visualization/hooks/VisualizationContext";
import { useTick } from "@pixi/react";
import type { Container } from "pixi.js";
import { useEffect, useMemo, useRef, useState } from "react";

import { SimulationEngine } from "../logic/SimulationEngine";

/**
 * Recursively collect all entity IDs from entity tree.
 */
function collectEntityIds(
  entities: SimulationEntityState[],
  ids: Set<string> = new Set(),
): Set<string> {
  for (const entity of entities) {
    ids.add(entity.entityId);
    if (entity.children.length > 0) {
      collectEntityIds(entity.children, ids);
    }
  }
  return ids;
}

/**
 * Check if two sets have the same elements.
 */
function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}

/**
 * Recursively update entity positions via Container refs (bypasses React).
 * Safely handles cases where refs may not be registered yet or container is destroyed.
 */
function updateEntityPositions(
  entities: SimulationEntityState[],
  getEntityRef: (entityId: string) => Container | undefined,
): void {
  for (const entity of entities) {
    const container = getEntityRef(entity.entityId);
    // Check container exists and is not destroyed (PixiJS sets destroyed=true after destroy())
    if (container && !container.destroyed) {
      container.x = entity.x;
      container.y = entity.y;
      container.rotation = entity.angle;
    }
    if (entity.children.length > 0) {
      updateEntityPositions(entity.children, getEntityRef);
    }
  }
}

/**
 * Hook to manage the SimulationEngine and derive entities based on playback time.
 *
 * Must be used within:
 * - A Pixi Application context (because of useTick)
 * - A PlaybackProvider (for playback state)
 * - A VisualizationProvider (for entity refs)
 *
 * This hook encapsulates all the complexity of the simulation engine lifecycle,
 * recording management, and time-based entity derivation.
 *
 * Performance optimization: Position updates are applied directly to PixiJS
 * Container refs, bypassing React re-renders. React state is only updated
 * when the entity structure changes (entities added/removed).
 */
export const useSimulationEntities = (): SimulationEntityState[] => {
  const { recording, clock } = usePlayback();
  const { getEntityRef } = useVisualization();
  const [entities, setEntities] = useState<SimulationEntityState[]>([]);

  // Track the last rendered time to avoid redundant calculations
  const lastRenderedTimeRef = useRef<number | null>(null);

  // Track entity IDs to detect structural changes
  const prevEntityIdsRef = useRef<Set<string>>(new Set());

  // Skip direct ref updates for one frame after structure change (refs need time to register)
  const skipDirectUpdateRef = useRef(false);

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
    prevEntityIdsRef.current = new Set();
    skipDirectUpdateRef.current = false;
  }, [recording]);

  // Use Pixi's tick to read time from clock and compute entities each frame
  useTick(() => {
    if (!engine) {
      if (entities.length > 0) {
        setEntities([]);
        prevEntityIdsRef.current = new Set();
      }
      return;
    }

    // Get current time from clock (no React state, just a method call)
    const currentTime = clock.getTime();

    // Skip if time hasn't changed (optimization for paused state)
    if (currentTime === lastRenderedTimeRef.current) {
      return;
    }

    lastRenderedTimeRef.current = currentTime;

    // Derive entities from current time
    const newEntities = engine.getEntitiesAtTime(currentTime);
    const newEntityIds = collectEntityIds(newEntities);

    // Check if structure changed (entities added or removed)
    const structureChanged = !setsEqual(prevEntityIdsRef.current, newEntityIds);

    if (structureChanged) {
      // Structure changed - update React state (triggers re-render to mount/unmount)
      setEntities(newEntities);
      prevEntityIdsRef.current = newEntityIds;
      // Skip direct updates next frame to allow refs to register
      skipDirectUpdateRef.current = true;
    } else if (skipDirectUpdateRef.current) {
      // First frame after structure change - refs should now be registered
      // Update positions but also clear the skip flag
      skipDirectUpdateRef.current = false;
      updateEntityPositions(newEntities, getEntityRef);
    } else {
      // Only positions changed - update PixiJS directly (no React re-render)
      updateEntityPositions(newEntities, getEntityRef);
    }
  });

  return entities;
};

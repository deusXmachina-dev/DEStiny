"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ScrollOffset } from "../types";
import { useVisualization } from "./VisualizationContext";

interface SceneTransform {
  zoom: number;
  scrollOffset: ScrollOffset;
}

const DEFAULT_TRANSFORM: SceneTransform = {
  zoom: 1.0,
  scrollOffset: { x: 0, y: 0 },
};

/**
 * Hook that polls SceneManager for current transform state.
 *
 * Reads zoom and scroll offset at regular intervals to keep React state in sync.
 *
 * @param intervalMs - Poll interval in milliseconds (default: 100ms)
 * @returns Current transform state { zoom, scrollOffset }
 */
export function useSceneTransform(intervalMs = 100): SceneTransform {
  const { getSceneManager, sceneManagerReady } = useVisualization();
  const [transform, setTransform] = useState<SceneTransform>(DEFAULT_TRANSFORM);
  const lastTransformRef = useRef<SceneTransform>(DEFAULT_TRANSFORM);

  useEffect(() => {
    const sceneManager = getSceneManager();
    if (!sceneManager || !sceneManagerReady) {
      return;
    }

    // Read and update state
    const updateTransform = () => {
      const zoom = sceneManager.getZoom();
      const scrollOffset = sceneManager.getScrollOffset();
      const last = lastTransformRef.current;

      // Only update if something changed
      const hasChanged =
        zoom !== last.zoom || scrollOffset.x !== last.scrollOffset.x || scrollOffset.y !== last.scrollOffset.y;

      if (hasChanged) {
        const newTransform = { zoom, scrollOffset };
        lastTransformRef.current = newTransform;
        setTransform(newTransform);
      }
    };

    // Initial read
    updateTransform();

    // Poll at interval
    const interval = setInterval(updateTransform, intervalMs);

    return () => clearInterval(interval);
  }, [getSceneManager, sceneManagerReady, intervalMs]);

  return transform;
}


"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ScrollOffset } from "../types";
import { useVisualization } from "./VisualizationContext";

interface SceneTransform {
  zoom: number;
  scrollOffset: ScrollOffset;
}

/**
 * Hook that subscribes to SceneManager transform changes with optional throttling.
 *
 * Use this hook when a React component needs to display or react to
 * zoom/scrollOffset changes. The throttle prevents excessive re-renders
 * during high-frequency updates like panning.
 *
 * @param throttleMs - Throttle interval in milliseconds (default: 100ms)
 * @returns Current transform state { zoom, scrollOffset }
 */
export function useSceneTransform(throttleMs = 100): SceneTransform {
  const { getSceneManager, sceneManagerReady } = useVisualization();

  // State for React re-renders
  const [transform, setTransform] = useState<SceneTransform>(() => {
    const sceneManager = getSceneManager();
    if (sceneManager) {
      return {
        zoom: sceneManager.getZoom(),
        scrollOffset: sceneManager.getScrollOffset(),
      };
    }
    return { zoom: 1.0, scrollOffset: { x: 0, y: 0 } };
  });

  // Refs for throttling
  const lastUpdateRef = useRef(0);
  const pendingUpdateRef = useRef<SceneTransform | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Throttled update function
  const throttledUpdate = useCallback(
    (zoom: number, scrollOffset: ScrollOffset) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      if (timeSinceLastUpdate >= throttleMs) {
        // Enough time has passed, update immediately
        lastUpdateRef.current = now;
        setTransform({ zoom, scrollOffset });
        pendingUpdateRef.current = null;
      } else {
        // Store pending update
        pendingUpdateRef.current = { zoom, scrollOffset };

        // Schedule update if not already scheduled
        if (!timeoutRef.current) {
          const delay = throttleMs - timeSinceLastUpdate;
          timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;
            if (pendingUpdateRef.current) {
              lastUpdateRef.current = Date.now();
              setTransform(pendingUpdateRef.current);
              pendingUpdateRef.current = null;
            }
          }, delay);
        }
      }
    },
    [throttleMs],
  );

  // Subscribe to SceneManager changes
  useEffect(() => {
    const sceneManager = getSceneManager();
    if (!sceneManager || !sceneManagerReady) {
      return;
    }

    // Get initial values
    setTransform({
      zoom: sceneManager.getZoom(),
      scrollOffset: sceneManager.getScrollOffset(),
    });

    // Subscribe with throttled handler
    const unsubscribe = sceneManager.subscribe(throttledUpdate);

    return () => {
      unsubscribe();
      // Clean up pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [throttledUpdate, sceneManagerReady]);

  return transform;
}

/**
 * Hook that provides SceneManager actions without subscribing to changes.
 *
 * Use this when you only need to call actions (like reset) without
 * needing to know the current transform values.
 */
export function useSceneActions() {
  const { getSceneManager } = useVisualization();

  const reset = useCallback(() => {
    const sceneManager = getSceneManager();
    sceneManager?.reset();
  }, [getSceneManager]);

  const setZoom = useCallback(
    (zoom: number) => {
      const sceneManager = getSceneManager();
      sceneManager?.setZoom(zoom);
    },
    [getSceneManager],
  );

  const setScrollOffset = useCallback(
    (offset: ScrollOffset) => {
      const sceneManager = getSceneManager();
      sceneManager?.setScrollOffset(offset);
    },
    [getSceneManager],
  );

  return { reset, setZoom, setScrollOffset };
}

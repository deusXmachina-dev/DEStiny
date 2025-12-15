"use client";

import { useApplication } from "@pixi/react";
import { RefObject, useEffect } from "react";

import { $api } from "@/lib/api-client";

import { useVisualization } from "./VisualizationContext";

/**
 * Hook for handling canvas resize events and syncing size with backend.
 *
 * This hook:
 * - Observes the parent container for size changes
 * - Resizes the PixiJS renderer to match container size
 * - Updates VisualizationContext screenSize state
 * - Updates SceneManager's internal screenSize
 * - Calls the backend API to persist canvas size
 *
 * Must be used within:
 * - A Pixi Application context (for app.renderer)
 * - A VisualizationProvider (for setScreenSize and getSceneManager)
 *
 * @param containerRef - Ref to the container div that wraps the canvas
 */
export const useCanvasResize = (
  containerRef: RefObject<HTMLDivElement | null>,
) => {
  const { app } = useApplication();
  const { setScreenSize, getSceneManager, sceneManagerReady } =
    useVisualization();
  const mutation = $api.useMutation("post", "/api/blueprint/canvas-size");

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !app?.renderer) {
      return;
    }

    const handleResize = () => {
      // Get dimensions from container element
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Skip if dimensions are invalid
      if (width <= 0 || height <= 0) {
        return;
      }

      // Resize the PixiJS renderer to match container size
      app.renderer.resize(width, height);

      const newSize = { width, height };

      // Update VisualizationContext state
      setScreenSize(newSize);

      // Update SceneManager's internal state
      const sceneManager = getSceneManager();
      if (sceneManager) {
        sceneManager.setScreenSize(newSize);
      }

      // Call backend API to persist canvas size
      mutation
        .mutateAsync({
          body: newSize,
        })
        .catch((error) => {
          console.error("Failed to update canvas size:", error);
        });
    };

    // Use ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    resizeObserver.observe(container);

    // Initial call to set size on mount
    handleResize();

    return () => {
      resizeObserver.disconnect();
    };
  }, [containerRef, sceneManagerReady]);
};

"use client";

import { RefObject, useCallback } from "react";

import { useVisualization } from "./VisualizationContext";

/**
 * Hook for handling HTML5 drag-and-drop onto the canvas container.
 *
 * This handles dropping items FROM OUTSIDE the canvas (e.g., entity palette)
 * ONTO the canvas. It converts screen coordinates to world coordinates
 * and invokes the registered onCanvasDrop callback.
 *
 * Note: This is separate from PixiJS pointer events (handled by useSceneInteractions)
 * because HTML5 drag events don't propagate into PixiJS.
 *
 * @param containerRef - Ref to the container div that wraps the canvas
 * @returns Event handlers to spread onto the container div
 */
export const useCanvasDropZone = (
  containerRef: RefObject<HTMLDivElement | null>,
) => {
  const { getInteractionCallbacks, getSceneManager, sceneManagerReady } =
    useVisualization();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      try {
        const data = JSON.parse(e.dataTransfer.getData("application/json"));
        const { entityType, parameters } = data;

        // Get drop coordinates relative to the container
        const rect = containerRef?.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }

        // Convert screen coordinates to world coordinates
        // Screen coordinates are relative to the canvas container
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Use SceneManager for coordinate transformation
        const sceneManager = getSceneManager();
        if (!sceneManager) {
          return;
        }

        const { x: worldX, y: worldY } = sceneManager.screenToWorld(
          screenX,
          screenY,
        );

        // Invoke registered callback with world coordinates
        const callbacks = getInteractionCallbacks();
        callbacks.onCanvasDrop?.(entityType, parameters || {}, worldX, worldY);
      } catch (error) {
        console.error("Error handling drop:", error);
      }
    },
    [containerRef, getSceneManager, getInteractionCallbacks, sceneManagerReady],
  );

  return { handleDragOver, handleDrop };
};

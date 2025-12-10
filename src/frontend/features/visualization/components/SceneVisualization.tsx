"use client";

import { Application } from "@pixi/react";
import { ReactNode, RefObject, useRef } from "react";

import { useVisualization } from "../hooks/VisualizationContext";
import { Scene } from "./pixi/Scene";
import { ResizeListener } from "./ResizeListener";

interface SceneVisualizationProps {
  children?: ReactNode;
}

/**
 * SceneVisualization - Core visualization component that renders the PixiJS application.
 *
 * This component handles:
 * - Pixi Application setup with resize handling
 * - Background rendering
 * - Scene rendering (entities come from VisualizationContext)
 * - Canvas drop handling (invokes registered callback)
 * - Children can be used to inject logic components (e.g., SimulationEntityUpdater, BuilderInteractionHandler)
 *
 * Must be used within a VisualizationProvider.
 */
export const SceneVisualization = ({ children }: SceneVisualizationProps) => {
  const { theme, getInteractionCallbacks, zoom, scrollOffset } = useVisualization();
  const parentRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      const { entityType, parameters } = data;

      // Get drop coordinates relative to the container
      const rect = parentRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      // Convert screen coordinates to world coordinates
      // Screen coordinates are relative to the canvas container
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Transform to world coordinates accounting for zoom and scrollOffset
      // world = (screen - scrollOffset) / zoom
      const worldX = (screenX - scrollOffset.x) / zoom;
      const worldY = (screenY - scrollOffset.y) / zoom;

      // Invoke registered callback with world coordinates
      const callbacks = getInteractionCallbacks();
      callbacks.onCanvasDrop?.(entityType, parameters || {}, worldX, worldY);
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  return (
    <div
      ref={parentRef}
      className="w-full h-full relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Application resizeTo={parentRef as RefObject<HTMLDivElement>}>
        <ResizeListener />
        <Scene />
        {children}
      </Application>
    </div>
  );
};

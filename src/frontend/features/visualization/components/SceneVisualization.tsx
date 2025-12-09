"use client";

import { Application } from "@pixi/react";
import { ReactNode, RefObject } from "react";

import { useVisualization } from "../hooks/VisualizationContext";
import { Background } from "./pixi/Background";
import { Scene } from "./pixi/Scene";
import { ResizeListener } from "./ResizeListener";

interface SceneVisualizationProps {
  parentRef: RefObject<HTMLDivElement | null>;
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
export const SceneVisualization = ({
  parentRef,
  children,
}: SceneVisualizationProps) => {
  const { theme, getInteractionCallbacks } = useVisualization();

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

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Invoke registered callback
      const callbacks = getInteractionCallbacks();
      callbacks.onCanvasDrop?.(entityType, parameters || {}, x, y);
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
        <Background theme={theme} />
        <Scene />
        {children}
      </Application>
    </div>
  );
};

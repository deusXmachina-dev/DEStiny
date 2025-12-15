"use client";

import { Application } from "@pixi/react";
import { ReactNode, RefObject, useRef } from "react";

import { useCanvasDropZone } from "../hooks/useCanvasDropZone";
import { Scene } from "./pixi/Scene";
import { ZoomPanControls } from "./ZoomPanControls";

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
 * - Canvas drop handling (via useCanvasDropZone hook)
 * - Children can be used to inject logic components (e.g., SimulationEntityUpdater, BuilderInteractionHandler)
 *
 * Must be used within a VisualizationProvider.
 */
export const SceneVisualization = ({ children }: SceneVisualizationProps) => {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const { handleDragOver, handleDrop } = useCanvasDropZone(parentRef);

  console.debug("SceneVisualization rerender");

  return (
    <div
      ref={parentRef}
      className="visualization-container w-full h-full relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Application resizeTo={parentRef as RefObject<HTMLDivElement>}>
        <Scene parentRef={parentRef} />
        {children}
      </Application>
      <ZoomPanControls />
    </div>
  );
};

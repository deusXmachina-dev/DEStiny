"use client";

import { Application } from "@pixi/react";
import { ReactNode, RefObject } from "react";

import { useVisualization } from "../hooks/VisualizationContext";
import { Background } from "./pixi/Background";
import { Scene } from "./pixi/Scene";
import { ResizeListener } from "./ResizeListener";

interface SceneVisualizationProps {
  parentRef: RefObject<HTMLDivElement | null>;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  children?: ReactNode;
}

/**
 * SceneVisualization - Core visualization component that renders the PixiJS application.
 *
 * This component handles:
 * - Pixi Application setup with resize handling
 * - Background rendering
 * - Scene rendering (entities come from VisualizationContext)
 * - Optional drag-and-drop handlers for builder mode
 * - Children can be used to inject logic components (e.g., SimulationEntityUpdater)
 *
 * Must be used within a VisualizationProvider.
 */
export const SceneVisualization = ({
  parentRef,
  onDragOver,
  onDrop,
  children,
}: SceneVisualizationProps) => {
  const { theme } = useVisualization();

  return (
    <div
      ref={parentRef}
      className="w-full h-full relative"
      onDragOver={onDragOver}
      onDrop={onDrop}
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

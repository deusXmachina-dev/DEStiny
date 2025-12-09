"use client";

import { SceneVisualization } from "@features/visualization/components/SceneVisualization";
import {
  type VisualizationHooks,
  VisualizationProvider,
} from "@features/visualization/hooks/VisualizationContext";
import { Container } from "pixi.js";
import { RefObject, useMemo, useRef } from "react";

import { DndProvider } from "../hooks/dnd/DndContext";
import { useCanvasDrop } from "../hooks/dnd/useCanvasDrop";
import { useDndManager } from "../hooks/dnd/useDndManager";
import { useDraggable } from "../hooks/dnd/useDraggable";
import { useBuilderEntities } from "../hooks/useBuilderEntities";
import { useEntityClick } from "../hooks/useEntityClick";
import { EntityEditor } from "./ui/EntityEditor";

/**
 * BuilderViewport - Main viewport component for builder mode.
 *
 * This component:
 * - Provides entities from blueprint to VisualizationContext
 * - Sets up builder-specific hooks (drag-and-drop, entity clicking)
 * - Renders SceneVisualization with drag handlers
 * - Renders EntityEditor for editing entities
 *
 * Must be used within BuilderProvider.
 */
export const BuilderViewport = () => {
  const parentRef = useRef<HTMLDivElement>(null);
  const entities = useBuilderEntities();
  const { onDragOver, onDrop } = useCanvasDrop(parentRef);

  // Create builder-specific hooks
  const hooks: VisualizationHooks = useMemo(
    () => ({
      useScene: () => {
        // Set up stage-level drag handlers
        useDndManager();
      },
      useEntity: (
        containerRef: RefObject<Container | null>,
        entityId: string | undefined
      ) => {
        // Set up drag start handler for this entity
        useDraggable(containerRef, entityId);
        // Set up click handler for this entity
        useEntityClick(containerRef, entityId);
      },
    }),
    []
  );

  return (
    <VisualizationProvider entities={entities} hooks={hooks}>
      <DndProvider>
        <SceneVisualization
          parentRef={parentRef}
          onDragOver={onDragOver}
          onDrop={onDrop}
        />
        <EntityEditor />
      </DndProvider>
    </VisualizationProvider>
  );
};

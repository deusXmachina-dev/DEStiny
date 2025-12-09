"use client";

import type { VisualizationHooks } from "@features/visualization/hooks/VisualizationContext";
import { Container } from "pixi.js";
import { RefObject } from "react";

import { useDndManager } from "./dnd/useDndManager";
import { useDraggable } from "./dnd/useDraggable";
import { useEntityClick } from "./useEntityClick";

/**
 * Creates builder-specific visualization hooks for drag-and-drop and entity interaction.
 *
 * Returns a VisualizationHooks object that:
 * - useScene: Sets up stage-level drag handlers via useDndManager
 * - useEntity: Sets up drag start and click handlers for individual entities
 */
export function createBuilderHooks(): VisualizationHooks {
  return {
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
  };
}

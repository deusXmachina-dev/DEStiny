"use client";

import { Container, FederatedPointerEvent } from "pixi.js";
import { RefObject, useEffect } from "react";

import { useAppMode } from "@/context/AppModeContext";

import { useDnd } from "./DndContext";

/**
 * Hook to make an individual entity container draggable (handles drag start).
 * 
 * Sets up pointerdown event handler on a specific entity container to initiate drag.
 * This hook should be used ONCE per entity component.
 * 
 * It works in conjunction with useDndManager, which handles drag move and end.
 * 
 * The drag flow:
 * 1. This hook handles pointerdown (drag start) on individual entities
 * 2. useDndManager handles pointermove (drag move) and pointerup (drag end) on the stage
 * 
 * Only active when mode is "builder".
 * 
 * @param containerRef - Ref to the PixiJS Container for this entity
 * @param entityId - Unique identifier for the entity
 */
export const useDraggable = (
  containerRef: RefObject<Container | null>,
  entityId: string | undefined
) => {
  const { mode } = useAppMode();
  const { startDrag } = useDnd();
  const isBuilderMode = mode === "builder";

  useEffect(() => {
    if (!isBuilderMode || !containerRef.current || !entityId) {
      // Reset interactivity when not in builder mode
      if (containerRef.current) {
        containerRef.current.eventMode = "auto";
        containerRef.current.cursor = "default";
        containerRef.current.alpha = 1;
      }
      return;
    }

    const container = containerRef.current;

    // Make container interactive
    container.eventMode = "static";
    container.cursor = "pointer";

    const onDragStart = (event: FederatedPointerEvent) => {
      if (!container.parent) {
        return;
      }

      // Get the pointer position in the container's parent space
      const pointerPos = container.parent.toLocal(event.global);

      // Calculate the offset between the container's position and the pointer
      const offset = {
        x: container.x - pointerPos.x,
        y: container.y - pointerPos.y,
      };

      // Start drag via context (no blueprint/setBlueprint needed)
      startDrag(container, entityId, offset);
    };

    // Set up container-level handler for drag start
    container.on("pointerdown", onDragStart);

    return () => {
      container.off("pointerdown", onDragStart);
    };
  }, [isBuilderMode, entityId, startDrag, containerRef]);
};

"use client";

import { Container, FederatedPointerEvent } from "pixi.js";
import { RefObject, useEffect, useRef } from "react";

import { useVisualization } from "./VisualizationContext";

interface DndState {
  target: Container | null;
  offset: { x: number; y: number };
  entityId: string | null;
  isDragging: boolean;
}

// Global drag state shared across all entities
const dndStateRef: { current: DndState } = {
  current: {
    target: null,
    offset: { x: 0, y: 0 },
    entityId: null,
    isDragging: false,
  },
};

/**
 * Hook to make an individual entity interactive (draggable and clickable).
 *
 * Handles:
 * - Drag start (pointerdown)
 * - Click detection (pointertap) - distinguishes from drags
 * - Invokes registered callbacks when events occur
 *
 * Works in conjunction with useStageInteractions which handles drag move and end.
 *
 * Only active when interactive is true in VisualizationContext.
 *
 * @param containerRef - Ref to the PixiJS Container for this entity
 * @param entityId - Unique identifier for the entity
 */
export const useEntityInteractions = (
  containerRef: RefObject<Container | null>,
  entityId: string | undefined
) => {
  const { getInteractionCallbacks, interactive } = useVisualization();
  const wasDraggingRef = useRef(false);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current || !entityId || !interactive) {
      // Reset container state when not interactive
      if (containerRef.current) {
        containerRef.current.eventMode = "auto";
        containerRef.current.cursor = "default";
        containerRef.current.alpha = 1;
      }
      return;
    }

    const container = containerRef.current;
    const CLICK_THRESHOLD = 5; // pixels

    // Make container interactive
    container.eventMode = "static";
    container.cursor = "pointer";

    const onPointerDown = (event: FederatedPointerEvent) => {
      if (!container.parent) {
        return;
      }

      // Store initial position for click detection
      dragStartPosRef.current = {
        x: event.global.x,
        y: event.global.y,
      };
      wasDraggingRef.current = false;

      // Get the pointer position in the container's parent space
      const pointerPos = container.parent.toLocal(event.global);

      // Calculate the offset between the container's position and the pointer
      const offset = {
        x: container.x - pointerPos.x,
        y: container.y - pointerPos.y,
      };

      // Start drag
      dndStateRef.current = {
        target: container,
        offset,
        entityId,
        isDragging: true,
      };
      container.alpha = 0.5;
    };

    const onPointerMove = (event: FederatedPointerEvent) => {
      if (!dragStartPosRef.current) {
        return;
      }

      // Check if pointer has moved significantly (indicating a drag)
      const distance = Math.sqrt(
        Math.pow(event.global.x - dragStartPosRef.current.x, 2) +
          Math.pow(event.global.y - dragStartPosRef.current.y, 2)
      );

      if (distance > CLICK_THRESHOLD) {
        wasDraggingRef.current = true;
      }
    };

    const onPointerUp = () => {
      dragStartPosRef.current = null;
      // Reset after a short delay to allow pointertap to check
      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 10);
    };

    const onPointerTap = () => {
      // Only trigger click if we didn't just finish a drag
      if (!wasDraggingRef.current && !dndStateRef.current.isDragging) {
        const callbacks = getInteractionCallbacks();
        callbacks.onEntityClick?.(entityId);
      }
    };

    container.on("pointerdown", onPointerDown);
    container.on("pointermove", onPointerMove);
    container.on("pointerup", onPointerUp);
    container.on("pointertap", onPointerTap);

    return () => {
      container.off("pointerdown", onPointerDown);
      container.off("pointermove", onPointerMove);
      container.off("pointerup", onPointerUp);
      container.off("pointertap", onPointerTap);

      // Reset container state
      container.eventMode = "auto";
      container.cursor = "default";
      container.alpha = 1;
    };
  }, [entityId, getInteractionCallbacks, containerRef, interactive]);
};

/**
 * Get the current drag state (for use by stage-level handlers).
 */
export const getDndState = () => dndStateRef.current;

/**
 * End the current drag operation (for use by stage-level handlers).
 */
export const endDrag = () => {
  if (dndStateRef.current.target) {
    dndStateRef.current.target.alpha = 1;
  }
  dndStateRef.current = {
    target: null,
    offset: { x: 0, y: 0 },
    entityId: null,
    isDragging: false,
  };
};

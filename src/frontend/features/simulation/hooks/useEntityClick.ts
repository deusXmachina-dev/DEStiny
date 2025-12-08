"use client";

import { useBuilder } from "@features/builder";
import { Container, FederatedPointerEvent } from "pixi.js";
import { RefObject, useEffect, useRef } from "react";

import { useAppMode } from "@/context/AppModeContext";

import { useDnd } from "./dnd/DndContext";

/**
 * Hook to handle clicks on entities (opens editor).
 * 
 * Distinguishes between clicks and drags:
 * - Uses pointertap event which fires on click without drag
 * - Checks drag state to ensure we don't trigger clicks during/after drags
 * - Prevents clicks when editor dialog is open
 * 
 * Only active when mode is "builder".
 * 
 * @param containerRef - Ref to the PixiJS Container for this entity
 * @param entityId - Unique identifier for the entity
 */
export const useEntityClick = (
  containerRef: RefObject<Container | null>,
  entityId: string | undefined
) => {
  const { mode } = useAppMode();
  const { getDndState } = useDnd();
  const { openEditor, isEditorOpen, isJustClosed } = useBuilder();
  const isBuilderMode = mode === "builder";
  const wasDraggingRef = useRef(false);

  useEffect(() => {
    if (!isBuilderMode || !containerRef.current || !entityId) {
      return;
    }

    const container = containerRef.current;
    let dragStartPos: { x: number; y: number } | null = null;
    const CLICK_THRESHOLD = 5; // pixels

    const onPointerDown = (event: FederatedPointerEvent) => {
      // Store the initial position to detect drags
      dragStartPos = {
        x: event.global.x,
        y: event.global.y,
      };
      wasDraggingRef.current = false;
    };

    const onPointerMove = (event: FederatedPointerEvent) => {
      if (!dragStartPos) {
        return;
      }

      // Check if pointer has moved significantly (indicating a drag)
      const distance = Math.sqrt(
        Math.pow(event.global.x - dragStartPos.x, 2) +
        Math.pow(event.global.y - dragStartPos.y, 2)
      );

      if (distance > CLICK_THRESHOLD) {
        wasDraggingRef.current = true;
      }
    };

    const onPointerUp = () => {
      dragStartPos = null;
      // Reset after a short delay to allow pointertap to check
      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 10);
    };

    // Use pointertap which fires on click without drag
    const onPointerTap = (event: FederatedPointerEvent) => {
      // Don't trigger click if editor is open or just closed
      if (isEditorOpen || isJustClosed()) {
        return;
      }

      // Check if the click originated from a dialog element
      // This prevents clicks from the dialog overlay from triggering entity clicks
      const { originalEvent } = event;
      if (originalEvent?.target) {
        const target = originalEvent.target as unknown as Element;
        if (target.closest('[data-slot="dialog-overlay"], [data-slot="dialog-content"]')) {
          return;
        }
      }

      const dragState = getDndState();
      // Only trigger click if no drag is active and we didn't just finish a drag
      if (!dragState.target && !wasDraggingRef.current) {
        openEditor(entityId);
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
    };
  }, [isBuilderMode, entityId, openEditor, isEditorOpen, isJustClosed, getDndState, containerRef]);
};

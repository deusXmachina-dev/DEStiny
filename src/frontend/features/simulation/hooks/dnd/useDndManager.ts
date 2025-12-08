"use client";

import { useBuilder } from "@features/builder";
import { useApplication } from "@pixi/react";
import { FederatedPointerEvent } from "pixi.js";
import { useEffect, useRef } from "react";

import { useAppMode } from "@/context/AppModeContext";

import { useDnd } from "./DndContext";

/**
 * Hook to handle stage-level drag operations (move and end).
 * 
 * Sets up global event handlers on the PixiJS stage for:
 * - pointermove: Updates entity position during drag
 * - pointerup/pointerupoutside: Finalizes drag and updates blueprint
 * 
 * This hook should be used ONCE at the Scene/Application level.
 * It works in conjunction with useDraggable, which handles drag initiation.
 * 
 * The drag flow:
 * 1. useDraggable handles pointerdown (drag start) on individual entities
 * 2. This hook handles pointermove (drag move) and pointerup (drag end) on the stage
 * 
 * Must be used within:
 * - A Pixi Application context (for app.stage)
 * - A DndProvider (for drag state)
 * - A BuilderProvider (for blueprint mutations)
 */
export const useDndManager = () => {
  const { mode } = useAppMode();
  const { getDndState, endDrag } = useDnd();
  const { moveEntity } = useBuilder();
  const { app } = useApplication();
  const isBuilderMode = mode === "builder";
  const stageRef = useRef(app.stage);

  // Update stage ref when app changes
  useEffect(() => {
    stageRef.current = app.stage;
  }, [app]);

  // Set up stage-level drag handlers once (only in builder mode)
  useEffect(() => {
    if (!isBuilderMode) {
      return;
    }

    // Set up stage to be interactive
    const currentStage = stageRef.current;
    currentStage.eventMode = "static";
    currentStage.hitArea = app.screen;

    const onDragMove = (event: FederatedPointerEvent) => {
      const dndState = getDndState();
      if (!dndState.target || !dndState.target.parent) {
        return;
      }

      // Get the pointer position in the target's parent space
      const pointerPos = dndState.target.parent.toLocal(event.global);

      // Apply the offset so the sprite moves naturally
      dndState.target.position.set(
        pointerPos.x + dndState.offset.x,
        pointerPos.y + dndState.offset.y
      );
    };

    const onDragEnd = () => {
      const dndState = getDndState();
      if (!dndState.target || !dndState.entityId) {
        return;
      }

      // Update blueprint with new position via BuilderContext
      moveEntity(dndState.entityId, dndState.target.x, dndState.target.y);

      // Reset drag state
      endDrag();
    };

    currentStage.on("pointermove", onDragMove);
    currentStage.on("pointerup", onDragEnd);
    currentStage.on("pointerupoutside", onDragEnd);

    return () => {
      const cleanupStage = stageRef.current;
      cleanupStage.off("pointermove", onDragMove);
      cleanupStage.off("pointerup", onDragEnd);
      cleanupStage.off("pointerupoutside", onDragEnd);
    };
  }, [isBuilderMode, app, getDndState, endDrag, moveEntity]);
};

"use client";

import { useApplication } from "@pixi/react";
import { FederatedPointerEvent } from "pixi.js";
import { useEffect, useRef } from "react";

import { updateBlueprintEntityPosition } from "../utils";
import { useDrag } from "./DragContext";
import { useSimulation } from "./SimulationContext";

/**
 * Hook to handle stage-level drag operations (move and end).
 * 
 * Sets up global event handlers on the PixiJS stage for:
 * - pointermove: Updates entity position during drag
 * - pointerup/pointerupoutside: Finalizes drag and updates blueprint
 * 
 * This hook should be used ONCE at the Scene/Application level.
 * It works in conjunction with useEntityDragStart, which handles drag initiation.
 * 
 * The drag flow:
 * 1. useEntityDragStart handles pointerdown (drag start) on individual entities
 * 2. This hook handles pointermove (drag move) and pointerup (drag end) on the stage
 * 
 * Must be used within:
 * - A Pixi Application context (for app.stage)
 * - A DragProvider (for drag state)
 */
export const useStageDragHandlers = () => {
  const { mode } = useSimulation();
  const { getDragState, endDrag } = useDrag();
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
      const dragState = getDragState();
      if (!dragState.target || !dragState.target.parent) {
        return;
      }

      // Get the pointer position in the target's parent space
      const pointerPos = dragState.target.parent.toLocal(event.global);

      // Apply the offset so the sprite moves naturally
      dragState.target.position.set(
        pointerPos.x + dragState.offset.x,
        pointerPos.y + dragState.offset.y
      );
    };

    const onDragEnd = () => {
      const dragState = getDragState();
      if (!dragState.target || !dragState.blueprint || !dragState.entityId || !dragState.setBlueprint) {
        return;
      }

      // Update blueprint with new position
      const newBlueprint = updateBlueprintEntityPosition(
        dragState.blueprint,
        dragState.entityId,
        dragState.target.x,
        dragState.target.y
      );
      dragState.setBlueprint(newBlueprint);

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
  }, [isBuilderMode, app, getDragState, endDrag]);
};

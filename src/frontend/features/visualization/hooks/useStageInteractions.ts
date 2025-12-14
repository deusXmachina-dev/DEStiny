"use client";

import { useApplication } from "@pixi/react";
import { FederatedPointerEvent } from "pixi.js";
import { useEffect, useRef } from "react";

import { useVisualization } from "./VisualizationContext";

/**
 * Hook to handle stage-level drag operations (move and end).
 *
 * Sets up global event handlers on the PixiJS stage for:
 * - pointermove: Updates entity position during drag
 * - pointerup/pointerupoutside: Finalizes drag and invokes onEntityDragEnd callback
 *
 * This hook should be used ONCE at the Scene level.
 * It works in conjunction with EntityManager, which handles drag initiation.
 *
 * Only active when interactive is true in VisualizationContext.
 *
 * Must be used within:
 * - A Pixi Application context (for app.stage)
 * - A VisualizationProvider (for callbacks)
 */
export const useStageInteractions = () => {
  const { getInteractionCallbacks, getEntityManager, interactive } =
    useVisualization();
  const { app } = useApplication();
  const stageRef = useRef(app.stage);

  // Update stage ref when app changes
  useEffect(() => {
    stageRef.current = app.stage;
  }, [app]);

  // Set up stage-level drag handlers once
  useEffect(() => {
    if (!interactive) {
      return;
    }

    const currentStage = stageRef.current;

    // Set up stage to be interactive
    currentStage.eventMode = "static";
    currentStage.hitArea = app.screen;

    const onDragMove = (event: FederatedPointerEvent) => {
      const entityManager = getEntityManager();
      if (!entityManager) {
        return;
      }

      const dndState = entityManager.getDndState();
      if (!dndState.target || !dndState.target.parent || !dndState.isDragging) {
        return;
      }

      // Get the pointer position in the target's parent space
      const pointerPos = dndState.target.parent.toLocal(event.global);

      // Apply the offset so the sprite moves naturally
      dndState.target.position.set(
        pointerPos.x + dndState.offset.x,
        pointerPos.y + dndState.offset.y,
      );
    };

    const onDragEnd = () => {
      const entityManager = getEntityManager();
      if (!entityManager) {
        return;
      }

      const dndState = entityManager.getDndState();
      if (!dndState.target || !dndState.entityId || !dndState.isDragging) {
        return;
      }

      // Invoke callback with new position
      const callbacks = getInteractionCallbacks();
      callbacks.onEntityDragEnd?.(
        dndState.entityId,
        dndState.target.x,
        dndState.target.y,
      );

      // Reset drag state
      entityManager.endDrag();
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
  }, [app, getInteractionCallbacks, getEntityManager, interactive]);
};

"use client";

import { useEffect } from "react";

import { InteractionCallbacks, useVisualization } from "./VisualizationContext";

/**
 * Hook for children components to register interaction event callbacks.
 *
 * The visualization layer will invoke these callbacks when:
 * - An entity drag ends (onEntityDragEnd)
 * - An entity is clicked (onEntityClick)
 * - An entity is dropped onto the canvas from external source (onCanvasDrop)
 *
 * Example usage:
 * ```tsx
 * function BuilderInteractionHandler() {
 *   const { moveEntity, addEntity, selectEntity } = useBuilder();
 *
 *   useInteractionEvents({
 *     onEntityDragEnd: (entityId, x, y) => moveEntity(entityId, x, y),
 *     onEntityClick: (entityId) => selectEntity(entityId),
 *     onCanvasDrop: (type, params, x, y) => addEntity(type, params, x, y),
 *   });
 *
 *   return null;
 * }
 * ```
 *
 * Must be used within a VisualizationProvider.
 */
export const useInteractionEvents = (callbacks: InteractionCallbacks) => {
  const { registerInteractionCallbacks } = useVisualization();

  useEffect(() => {
    registerInteractionCallbacks(callbacks);
  }, [callbacks, registerInteractionCallbacks]);
};

"use client";

import { useInteractionEvents } from "@features/visualization/hooks/useInteractionEvents";
import { useVisualization } from "@features/visualization/hooks/VisualizationContext";
import { useEffect } from "react";

import { useBuilder } from "../hooks/BuilderContext";
import { useBuilderEntities } from "../hooks/useBuilderEntities";

/**
 * BuilderInteractionHandler - Updates entities and registers builder-specific interaction callbacks.
 *
 * Similar to SimulationEntityUpdater, this component:
 * 1. Gets entities from BuilderContext (useBuilderEntities)
 * 2. Updates VisualizationContext with current entities
 * 3. Registers interaction callbacks for builder-specific actions
 *
 * Must be used within:
 * - A VisualizationProvider (for entity updates and interaction events)
 * - A BuilderProvider (for builder actions and entities)
 */
export function BuilderInteractionHandler() {
  const entities = useBuilderEntities();
  const { setEntities } = useVisualization();
  const { moveEntity, addEntity, openEditor } = useBuilder();

  // Update visualization entities from builder state
  useEffect(() => {
    setEntities(entities);
  }, [entities, setEntities]);

  // Register interaction callbacks
  useInteractionEvents({
    onEntityDragEnd: (entityId, x, y) => {
      moveEntity(entityId, x, y);
    },
    onEntityClick: (entityId) => {
      openEditor(entityId);
    },
    onCanvasDrop: (entityType, parameters, x, y) => {
      addEntity(entityType, parameters, x, y);
    },
  });

  return null;
}

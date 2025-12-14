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
 * 2. Updates EntityManager with current entities (imperatively, no React state)
 * 3. Registers interaction callbacks for builder-specific actions
 *
 * Must be used within:
 * - A VisualizationProvider (for EntityManager and interaction events)
 * - A BuilderProvider (for builder actions and entities)
 */
export function BuilderInteractionHandler() {
  const entities = useBuilderEntities();
  const { getEntityManager } = useVisualization();
  const { moveEntity, addEntity, openEditor } = useBuilder();

  // Update visualization entities from builder state via EntityManager
  useEffect(() => {
    const entityManager = getEntityManager();
    if (entityManager) {
      entityManager.updateEntities(entities);
    }
  }, [entities, getEntityManager]);

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

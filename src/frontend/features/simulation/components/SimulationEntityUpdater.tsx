"use client";

import { useVisualization } from "@features/visualization/hooks/VisualizationContext";
import { useEffect } from "react";

import { useSimulationEntities } from "../hooks/useSimulationEntities";

/**
 * SimulationEntityUpdater - Component that runs inside Pixi Application context.
 *
 * This component calls useSimulationEntities (which requires useTick) and
 * updates the VisualizationContext with the current entities.
 *
 * Must be used inside a Pixi Application context.
 */
export function SimulationEntityUpdater() {
  const entities = useSimulationEntities();
  const { setEntities } = useVisualization();

  useEffect(() => {
    setEntities(entities);
  }, [entities, setEntities]);

  return null;
}

"use client";

import { useSimulationEntities } from "../hooks/useSimulationEntities";

/**
 * SimulationEntityUpdater - Component that runs inside Pixi Application context.
 *
 * This component calls useSimulationEntities (which requires useTick) and
 * updates entities via EntityManager (imperatively, no React state).
 *
 * Must be used inside a Pixi Application context.
 */
export function SimulationEntityUpdater() {
  // Hook handles all entity updates imperatively via EntityManager
  useSimulationEntities();

  return null;
}

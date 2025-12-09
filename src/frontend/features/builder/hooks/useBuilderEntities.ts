"use client";

import { useBuilder } from "@features/builder";
import type { SimulationEntityState } from "@features/visualization";
import { useMemo } from "react";

import { blueprintToEntityStates } from "../utils";

/**
 * Hook to derive simulation entities from the builder blueprint.
 * 
 * Must be used within:
 * - A BuilderProvider (for blueprint)
 * 
 * This hook converts the blueprint state into renderable entity states.
 * It's a pure transformation - no side effects, no time-based logic.
 */
export const useBuilderEntities = (): SimulationEntityState[] => {
  const { blueprint } = useBuilder();

  return useMemo(() => blueprintToEntityStates(blueprint), [blueprint]);
};

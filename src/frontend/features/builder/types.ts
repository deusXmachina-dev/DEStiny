/**
 * Schema definitions for the drag-and-drop scenario builder.
 *
 * Frontend now reuses backend OpenAPI-generated types directly to avoid
 * duplication. All types are sourced from `@/types/api`.
 */

import type { components } from "@/types/api";

export type BuilderEntitySchema = components["schemas"]["BuilderEntitySchema"];
export type BlueprintEntity = components["schemas"]["BlueprintEntity"];
export type SimulationBlueprint = components["schemas"]["Blueprint"];
export type BlueprintEntityParameter = components["schemas"]["BlueprintEntityParameter"];
export type BlueprintParameterType = components["schemas"]["BlueprintParameterType"];
export type ParameterInfo = components["schemas"]["ParameterInfo"];

// Derive parameter unions directly from generated schema shapes.
export type ParameterType = components["schemas"]["ParameterType"];
export type ParameterValue = components["schemas"]["BlueprintEntityParameter"]["value"];

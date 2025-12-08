import type { BlueprintEntity, ParameterValue, SimulationBlueprint, SimulationEntityState } from "./types";

/**
 * Linear interpolation between two values.
 */
export const lerp = (start: number, end: number, t: number): number => start + (end - start) * t;

/**
 * Convert blueprint entities to simulation entity states for rendering.
 * Extracts x, y, and angle from entity parameters.
 */
export const blueprintToEntityStates = (
  blueprint: SimulationBlueprint | null
): SimulationEntityState[] => {
  if (!blueprint) {
    return [];
  }

  return blueprint.entities.map((entity: BlueprintEntity) => {
    const x = typeof entity.parameters.x === "number" ? entity.parameters.x : 0;
    const y = typeof entity.parameters.y === "number" ? entity.parameters.y : 0;
    const angle = typeof entity.parameters.angle === "number" ? entity.parameters.angle : 0;

    return {
      entityId: entity.uuid,
      entityType: entity.entityType as SimulationEntityState["entityType"],
      x,
      y,
      angle,
      children: [],
    };
  });
};

/**
 * Create a new blueprint entity from a schema and position.
 */
export const createBlueprintEntity = (
  entityType: string,
  parameters: Record<string, "string" | "number">,
  x: number,
  y: number
): BlueprintEntity => {
  // Generate UUID
  const uuid = `${entityType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Create parameters object with default values based on schema
  const entityParameters: Record<string, ParameterValue> = {
    x,
    y,
  };

  // Add default values for other parameters based on their types
  for (const [key, type] of Object.entries(parameters)) {
    if (key !== "x" && key !== "y") {
      if (type === "number") {
        entityParameters[key] = 0;
      } else {
        entityParameters[key] = "";
      }
    }
  }

  return {
    entityType,
    uuid,
    parameters: entityParameters,
  };
};

/**
 * Update the position of an entity in the blueprint.
 */
export const updateBlueprintEntityPosition = (
  blueprint: SimulationBlueprint,
  entityId: string,
  x: number,
  y: number
): SimulationBlueprint => ({
  ...blueprint,
  entities: blueprint.entities.map((entity) =>
    entity.uuid === entityId
      ? {
          ...entity,
          parameters: {
            ...entity.parameters,
            x,
            y,
          },
        }
      : entity
  ),
});

/**
 * Remove an entity from the blueprint by its UUID.
 */
export const removeBlueprintEntity = (
  blueprint: SimulationBlueprint,
  entityId: string
): SimulationBlueprint => ({
  ...blueprint,
  entities: blueprint.entities.filter((entity) => entity.uuid !== entityId),
});

/**
 * Update parameters of an entity in the blueprint.
 */
export const updateBlueprintEntityParameters = (
  blueprint: SimulationBlueprint,
  entityId: string,
  parameters: Record<string, ParameterValue>
): SimulationBlueprint => ({
  ...blueprint,
  entities: blueprint.entities.map((entity) =>
    entity.uuid === entityId
      ? {
          ...entity,
          parameters: {
            ...entity.parameters,
            ...parameters,
          },
        }
      : entity
  ),
});

/**
 * Find a blueprint entity by its UUID.
 */
export const findBlueprintEntity = (
  blueprint: SimulationBlueprint | null,
  entityId: string
): BlueprintEntity | undefined => {
  if (!blueprint) {
    return undefined;
  }
  return blueprint.entities.find((entity) => entity.uuid === entityId);
};


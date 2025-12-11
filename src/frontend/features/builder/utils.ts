import type { SimulationEntityState } from "@features/visualization";

import type {
  BlueprintEntity,
  BlueprintEntityParameter,
  BlueprintParameterType,
  ParameterType,
  ParameterValue,
  SimulationBlueprint,
} from "./types";

/**
 * Extract a numeric parameter value from entity parameters.
 * Returns the default value if the parameter is missing or not a number.
 */
const extractNumericParameter = (
  parameters: Record<string, BlueprintEntityParameter>,
  key: string,
  defaultValue: number = 0,
): number => {
  const param = parameters[key];
  return param && typeof param.value === "number" ? param.value : defaultValue;
};

/**
 * Create a position parameter (x or y) as a BlueprintEntityParameter.
 */
const createPositionParameter = (
  name: "x" | "y",
  value: number,
): BlueprintEntityParameter => ({
  name,
  parameterType: "primitive" as BlueprintParameterType,
  value,
});

/**
 * Convert blueprint entities to simulation entity states for rendering.
 * Extracts x, y, and angle from entity parameters.
 */
export const blueprintToEntityStates = (
  blueprint: SimulationBlueprint | null,
): SimulationEntityState[] => {
  if (!blueprint) {
    return [];
  }

  return blueprint.entities.map((entity: BlueprintEntity) => {
    const x = extractNumericParameter(entity.parameters, "x");
    const y = extractNumericParameter(entity.parameters, "y");
    const angle = extractNumericParameter(entity.parameters, "angle");

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
  entityType: BlueprintEntity["entityType"],
  parameters: Record<string, ParameterType>,
  x: number,
  y: number,
): BlueprintEntity => {
  // Generate UUID
  const uuid = `${entityType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create parameters dict with default values based on schema
  const entityParameters: Record<string, BlueprintEntityParameter> = {
    x: createPositionParameter("x", x),
    y: createPositionParameter("y", y),
  };

  // Add default values for other parameters based on their types
  for (const [key, type] of Object.entries(parameters)) {
    if (key !== "x" && key !== "y") {
      let defaultValue: ParameterValue;
      let paramType: BlueprintParameterType = "primitive";

      if (type === "number") {
        defaultValue = 0;
      } else if (type === "boolean") {
        defaultValue = false;
      } else if (type === "entity") {
        defaultValue = "";
        paramType = "entity";
      } else {
        defaultValue = "";
      }

      entityParameters[key] = {
        name: key,
        parameterType: paramType,
        value: defaultValue,
      };
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
  y: number,
): SimulationBlueprint => ({
  ...blueprint,
  entities: blueprint.entities.map((entity) =>
    entity.uuid === entityId
      ? {
          ...entity,
          parameters: {
            ...entity.parameters,
            x: createPositionParameter("x", x),
            y: createPositionParameter("y", y),
          },
        }
      : entity,
  ),
});

/**
 * Remove an entity from the blueprint by its UUID.
 */
export const removeBlueprintEntity = (
  blueprint: SimulationBlueprint,
  entityId: string,
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
  parameters: Record<string, BlueprintEntityParameter>,
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
      : entity,
  ),
});

/**
 * Find a blueprint entity by its UUID.
 */
export const findBlueprintEntity = (
  blueprint: SimulationBlueprint | null,
  entityId: string,
): BlueprintEntity | undefined => {
  if (!blueprint) {
    return undefined;
  }
  return blueprint.entities.find((entity) => entity.uuid === entityId);
};

/**
 * Get available entities for an entity parameter, filtered by allowed types.
 */
export const getAvailableEntitiesForParameter = (
  blueprint: SimulationBlueprint,
  allowedEntityTypes: string[] | null | undefined,
  excludeUuid?: string,
): BlueprintEntity[] => {
  return blueprint.entities.filter((entity) => {
    // Exclude the current entity being edited
    if (excludeUuid && entity.uuid === excludeUuid) {
      return false;
    }

    // If no restrictions, allow all entity types
    if (!allowedEntityTypes || allowedEntityTypes.length === 0) {
      return true;
    }

    // Filter by allowed entity types
    return allowedEntityTypes.includes(entity.entityType);
  });
};

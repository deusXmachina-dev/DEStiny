import type { SimulationEntityState } from "@features/visualization";

import type {
  BlueprintEntity,
  BlueprintEntityParameter,
  BlueprintParameterType,
  ParameterInfo,
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
 * Create both x and y position parameters as a record.
 */
const createPositionParameters = (
  x: number,
  y: number,
): Record<"x" | "y", BlueprintEntityParameter> => ({
  x: createPrimitiveParameter("x", x),
  y: createPrimitiveParameter("y", y),
});

/**
 * Create a primitive parameter as a BlueprintEntityParameter.
 */
export const createPrimitiveParameter = (
  name: string,
  value: ParameterValue,
): BlueprintEntityParameter => ({
  name,
  parameterType: "primitive" as BlueprintParameterType,
  value,
});

/**
 * Create an entity parameter as a BlueprintEntityParameter.
 */
export const createEntityParameter = (
  name: string,
  entityName: string,
): BlueprintEntityParameter => ({
  name,
  parameterType: "entity" as BlueprintParameterType,
  value: entityName,
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
      entityId: entity.name,
      entityType: entity.entityType as SimulationEntityState["entityType"],
      x,
      y,
      angle,
      children: [],
      name: entity.name,
    };
  });
};

/**
 * Format a display name (entity type or parameter name) for UI: replace underscores with spaces and capitalize first letter.
 * Example: "grid_node" -> "Grid node", "source" -> "Source", "max_capacity" -> "Max capacity"
 */
export const formatDisplayName = (name: string): string => {
  const withSpaces = name.replace(/_/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1).toLowerCase();
};

/**
 * Get the next default name for an entity type based on existing entities.
 * Format: "{EntityType} {number}" (e.g., "Source 1", "Buffer 2")
 * Uses gap-aware logic: finds the first available number starting from 1.
 */
export const getNextEntityName = (
  entityType: string,
  blueprint: SimulationBlueprint,
): string => {
  // Format entity type: replace underscores with spaces and capitalize first letter
  const capitalizedType = formatDisplayName(entityType);

  // Get all existing entities of the same type
  const existingEntities = blueprint.entities.filter(
    (entity) => entity.entityType === entityType,
  );

  // Extract numbers from existing names
  // Pattern: "{Type} {number}" - extract the number part
  const usedNumbers = new Set<number>();
  const namePattern = new RegExp(`^${capitalizedType} (\\d+)$`);

  for (const entity of existingEntities) {
    const match = entity.name.match(namePattern);
    if (match) {
      if (!match[1]) {
        continue;
      }
      const num = parseInt(match[1], 10);
      usedNumbers.add(num);
    }
  }

  // Find the first available number starting from 1
  let nextNumber = 1;
  while (usedNumbers.has(nextNumber)) {
    nextNumber++;
  }

  return `${capitalizedType} ${nextNumber}`;
};

/**
 * Create a new blueprint entity from a schema and position.
 */
export const createBlueprintEntity = (
  name: string,
  entityType: BlueprintEntity["entityType"],
  parameters: Record<string, ParameterInfo>,
  x: number,
  y: number,
): BlueprintEntity => {
  // Create parameters dict with default values based on schema
  const entityParameters: Record<string, BlueprintEntityParameter> = {
    ...createPositionParameters(x, y),
  };

  // Add default values for other parameters based on their types
  for (const [key, { type }] of Object.entries(parameters)) {
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
    name,
    parameters: entityParameters,
  };
};

/**
 * Update the position of an entity in the blueprint.
 */
export const updateBlueprintEntityPosition = (
  blueprint: SimulationBlueprint,
  entityName: string,
  x: number,
  y: number,
): SimulationBlueprint => ({
  ...blueprint,
  entities: blueprint.entities.map((entity) =>
    entity.name === entityName
      ? {
          ...entity,
          parameters: {
            ...entity.parameters,
            ...createPositionParameters(x, y),
          },
        }
      : entity,
  ),
});

/**
 * Remove an entity from the blueprint by its name.
 */
export const removeBlueprintEntity = (
  blueprint: SimulationBlueprint,
  entityName: string,
): SimulationBlueprint => ({
  ...blueprint,
  entities: blueprint.entities.filter((entity) => entity.name !== entityName),
});

/**
 * Update parameters of an entity in the blueprint.
 */
export const updateBlueprintEntityParameters = (
  blueprint: SimulationBlueprint,
  entityName: string,
  parameters: Record<string, BlueprintEntityParameter>,
): SimulationBlueprint => ({
  ...blueprint,
  entities: blueprint.entities.map((entity) =>
    entity.name === entityName
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
 * Update the name of an entity in the blueprint.
 * Also updates all entity parameter references that point to the old name.
 */
export const updateBlueprintEntityName = (
  blueprint: SimulationBlueprint,
  oldName: string,
  newName: string,
): SimulationBlueprint => ({
  ...blueprint,
  entities: blueprint.entities.map((entity) => {
    // Update the entity's own name if it matches
    if (entity.name === oldName) {
      return { ...entity, name: newName };
    }

    // Update any entity parameter references to the old name
    const updatedParameters: Record<string, BlueprintEntityParameter> = {};
    let hasChanges = false;

    for (const [paramName, param] of Object.entries(entity.parameters)) {
      if (
        param.parameterType === "entity" &&
        typeof param.value === "string" &&
        param.value === oldName
      ) {
        // Update the reference to point to the new name
        updatedParameters[paramName] = {
          ...param,
          value: newName,
        };
        hasChanges = true;
      } else {
        updatedParameters[paramName] = param;
      }
    }

    return hasChanges ? { ...entity, parameters: updatedParameters } : entity;
  }),
});

/**
 * Find a blueprint entity by its name.
 */
export const findBlueprintEntity = (
  blueprint: SimulationBlueprint | null,
  entityName: string,
): BlueprintEntity | undefined => {
  if (!blueprint) {
    return undefined;
  }
  return blueprint.entities.find((entity) => entity.name === entityName);
};

/**
 * Get available entities for an entity parameter, filtered by allowed types.
 */
export const getAvailableEntitiesForParameter = (
  blueprint: SimulationBlueprint,
  allowedEntityTypes: string[] | null | undefined,
  excludeName?: string,
): BlueprintEntity[] =>
  blueprint.entities.filter((entity) => {
    // Exclude the current entity being edited
    if (excludeName && entity.name === excludeName) {
      return false;
    }

    // If no restrictions, allow all entity types
    if (!allowedEntityTypes || allowedEntityTypes.length === 0) {
      return true;
    }

    // Filter by allowed entity types
    return allowedEntityTypes.includes(entity.entityType);
  });

/**
 * Check if a string value represents an intermediate number input state
 * (e.g., empty, just "-", just ".", "-.").
 */
export const isIntermediateNumberState = (value: string): boolean =>
  value === "" || value === "-" || value === "." || value === "-.";

/**
 * Parse a string value to a number, handling intermediate states.
 * Returns the parsed number or 0 for intermediate/invalid states.
 */
export const parseNumberValue = (value: string): number => {
  if (isIntermediateNumberState(value)) {
    return 0;
  }
  const parsed = Number(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Finalize a number input value, converting intermediate states to 0.
 * Used on blur and form submission.
 */
export const finalizeNumberValue = (value: string): number =>
  parseNumberValue(value);

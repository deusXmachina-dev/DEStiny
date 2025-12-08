import type { BlueprintEntity, BoundingBox, ParameterValue, SimulationBlueprint, SimulationEntityState } from "./types";

/**
 * Linear interpolation between two values.
 */
export const lerp = (start: number, end: number, t: number): number => start + (end - start) * t;


/**
 * Calculate the offset needed to center the scene in the viewport.
 */
export const calculateSceneOffset = (
  boundingBox: BoundingBox | null,
  screenWidth: number,
  screenHeight: number
): { offsetX: number; offsetY: number } => {
  if (!boundingBox) {
    return { offsetX: 0, offsetY: 0 };
  }

  const { minX, minY, maxX, maxY } = boundingBox;
  const worldWidth = maxX - minX;
  const worldHeight = maxY - minY;

  // Center the bounding box in the screen
  const offsetX = (screenWidth - worldWidth) / 2 - minX;
  const offsetY = (screenHeight - worldHeight) / 2 - minY;

  return { offsetX, offsetY };
};

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
 * Calculate bounding box from blueprint entities.
 */
export const calculateBlueprintBoundingBox = (
  blueprint: SimulationBlueprint | null
): BoundingBox | null => {
  if (!blueprint || blueprint.entities.length === 0) {
    return null;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const entity of blueprint.entities) {
    const x = typeof entity.parameters.x === "number" ? entity.parameters.x : 0;
    const y = typeof entity.parameters.y === "number" ? entity.parameters.y : 0;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  // Add some padding
  const padding = 50;
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding,
  };
};

/**
 * Convert screen coordinates to world coordinates.
 * Accounts for the scene offset that centers the content.
 */
export const screenToWorldCoordinates = (
  screenX: number,
  screenY: number,
  offsetX: number,
  offsetY: number
): { x: number; y: number } => ({
  x: screenX - offsetX,
  y: screenY - offsetY,
});

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


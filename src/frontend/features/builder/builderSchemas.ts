/**
 * Manual builder entity schemas.
 *
 * TODO: These should eventually come from the engine/backend.
 * For now, this is a simple manual schema for the Person entity.
 */

import { BuilderEntitySchema } from "./types";

/**
 * Simple Person entity schema.
 *
 * A Person can be placed at an initial position and given a target position to walk to.
 * For the initial simple implementation, we support a single target.
 */
export const PERSON: BuilderEntitySchema = {
  entityType: "human",
  icon: "/assets/human.png",
  parameters: {
    // Initial position
    x: "number",
    y: "number",
    // Target position to walk to
    targetX: "number",
    targetY: "number",
  },
};

/**
 * AGV entity schema.
 */
export const AGV: BuilderEntitySchema = {
  entityType: "agv",
  icon: "/assets/agv.png",
  parameters: {
    // Initial position
    x: "number",
    y: "number",
    // Target position to walk to
    targetX: "number",
    targetY: "number",
  },
};

/**
 * Robot entity schema.
 */
export const ROBOT: BuilderEntitySchema = {
  entityType: "robot",
  icon: "/assets/robot.png",
  parameters: {
    // Initial position
    x: "number",
    y: "number",
    // Target position to walk to
    targetX: "number",
    targetY: "number",
  },
};

/**
 * Box entity schema.
 */
export const BOX: BuilderEntitySchema = {
  entityType: "box",
  icon: "/assets/box.png",
  parameters: {
    // Initial position
    x: "number",
    y: "number",
    // Target position to walk to
    targetX: "number",
    targetY: "number",
  },
};

/**
 * Palette entity schema.
 */
export const PALETTE: BuilderEntitySchema = {
  entityType: "palette",
  icon: "/assets/palette.png",
  parameters: {
    // Initial position
    x: "number",
    y: "number",
    // Target position to walk to
    targetX: "number",
    targetY: "number",
  },
};

/**
 * Counter entity schema.
 */
export const COUNTER: BuilderEntitySchema = {
  entityType: "counter",
  icon: "/assets/counter.png",
  parameters: {
    // Initial position
    x: "number",
    y: "number",
    // Target position to walk to
    targetX: "number",
    targetY: "number",
  },
};

/**
 * Registry of all available builder schemas.
 * Used by the builder UI to populate the toolbox.
 */
export const AVAILABLE_SCHEMAS: BuilderEntitySchema[] = [
  PERSON,
  AGV,
  ROBOT,
  BOX,
  PALETTE,
  COUNTER,
];

/**
 * Example blueprint for a simple Person walk scenario.
 *
 * This demonstrates what a blueprint would look like for a Person
 * starting at (100, 100) and walking to (500, 300).
 */
export const EXAMPLE_PERSON_BLUEPRINT = {
  simParams: {
    initialTime: 0,
    duration: 10,
  },
  entities: [
    {
      entityType: "human",
      uuid: "person-1",
      parameters: {
        x: 100,
        y: 100,
        targetX: 500,
        targetY: 300,
      },
    },
  ],
} as const;

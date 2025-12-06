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
export const PERSON_SCHEMA: BuilderEntitySchema = {
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

import { describe, expect, it } from "vitest";

import type { SimulationBlueprint } from "./types";
import { getNextEntityName } from "./utils";

describe("getNextEntityName", () => {
  it("returns 'Type 1' for the first entity of a type", () => {
    const blueprint: SimulationBlueprint = {
      entities: [],
    };

    const result = getNextEntityName("source", blueprint);

    expect(result).toBe("Source 1");
  });

  it("returns 'Type 2' when 'Type 1' already exists", () => {
    const blueprint: SimulationBlueprint = {
      entities: [
        {
          entityType: "source",
          name: "Source 1",
          parameters: {},
        },
      ],
    };

    const result = getNextEntityName("source", blueprint);

    expect(result).toBe("Source 2");
  });

  it("finds the first gap in numbering", () => {
    const blueprint: SimulationBlueprint = {
      entities: [
        {
          entityType: "source",
          name: "Source 1",
          parameters: {},
        },
        {
          entityType: "source",
          name: "Source 3",
          parameters: {},
        },
      ],
    };

    const result = getNextEntityName("source", blueprint);

    expect(result).toBe("Source 2");
  });

  it("ignores entities of different types", () => {
    const blueprint: SimulationBlueprint = {
      entities: [
        {
          entityType: "source",
          name: "Source 1",
          parameters: {},
        },
        {
          entityType: "buffer",
          name: "Buffer 1",
          parameters: {},
        },
      ],
    };

    const result = getNextEntityName("source", blueprint);

    expect(result).toBe("Source 2");
  });

  it("ignores entities with non-matching names", () => {
    const blueprint: SimulationBlueprint = {
      entities: [
        {
          entityType: "source",
          name: "Source 1",
          parameters: {},
        },
        {
          entityType: "source",
          name: "Custom Name",
          parameters: {},
        },
        {
          entityType: "source",
          name: "Source Custom",
          parameters: {},
        },
      ],
    };

    const result = getNextEntityName("source", blueprint);

    expect(result).toBe("Source 2");
  });

  it("capitalizes the entity type correctly", () => {
    const blueprint: SimulationBlueprint = {
      entities: [],
    };

    expect(getNextEntityName("agv", blueprint)).toBe("Agv 1");
    expect(getNextEntityName("BUFFER", blueprint)).toBe("Buffer 1");
    expect(getNextEntityName("source", blueprint)).toBe("Source 1");
  });

  it("replaces underscores with spaces in entity type", () => {
    const blueprint: SimulationBlueprint = {
      entities: [],
    };

    expect(getNextEntityName("grid_node", blueprint)).toBe("Grid node 1");
    expect(getNextEntityName("manufacturing_cell", blueprint)).toBe(
      "Manufacturing cell 1",
    );
  });
});

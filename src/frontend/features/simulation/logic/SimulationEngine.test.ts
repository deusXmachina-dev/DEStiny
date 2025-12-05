import type { SimulationRecording } from "@features/playback";
import { describe, expect,it } from "vitest";

import type { SimulationMotionSegment } from "../types";
import { SimulationEngine } from "./SimulationEngine";

// Helper to create a motion segment with defaults
const createSegment = (
  overrides: Partial<SimulationMotionSegment> & Pick<SimulationMotionSegment, "entityId" | "entityType">
): SimulationMotionSegment => ({
  startTime: 0,
  endTime: 10,
  startX: 0,
  startY: 0,
  endX: 100,
  endY: 100,
  startAngle: 0,
  endAngle: 0,
  parentId: null,
  ...overrides,
});

describe("SimulationEngine", () => {
  describe("duration", () => {
    it("returns the recording duration", () => {
      const recording: SimulationRecording = {
        duration: 30,
        segments_by_entity: {},
      };
      const engine = new SimulationEngine(recording);
      expect(engine.duration).toBe(30);
    });
  });

  describe("getEntitiesAtTime", () => {
    it("returns empty array when no segments exist", () => {
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {},
      };
      const engine = new SimulationEngine(recording);
      expect(engine.getEntitiesAtTime(5)).toEqual([]);
    });

    it("returns empty array when entity has empty segments", () => {
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {
          "entity-1": [],
        },
      };
      const engine = new SimulationEngine(recording);
      expect(engine.getEntitiesAtTime(5)).toEqual([]);
    });

    it("interpolates position at midpoint of segment", () => {
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 0,
              endTime: 10,
              startX: 0,
              startY: 0,
              endX: 100,
              endY: 200,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const entities = engine.getEntitiesAtTime(5);

      expect(entities).toHaveLength(1);
      expect(entities[0].entityId).toBe("agv1");
      expect(entities[0].x).toBe(50);
      expect(entities[0].y).toBe(100);
    });

    it("returns start position at time 0", () => {
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 0,
              endTime: 10,
              startX: 10,
              startY: 20,
              endX: 100,
              endY: 200,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const entities = engine.getEntitiesAtTime(0);

      expect(entities[0].x).toBe(10);
      expect(entities[0].y).toBe(20);
    });

    it("returns end position at end time", () => {
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 0,
              endTime: 10,
              startX: 10,
              startY: 20,
              endX: 100,
              endY: 200,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const entities = engine.getEntitiesAtTime(10);

      expect(entities[0].x).toBe(100);
      expect(entities[0].y).toBe(200);
    });

    it("does not return entity before its segment starts", () => {
      const recording: SimulationRecording = {
        duration: 20,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 5,
              endTime: 15,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const entities = engine.getEntitiesAtTime(2);

      expect(entities).toHaveLength(0);
    });

    it("does not return entity after its segment ends", () => {
      const recording: SimulationRecording = {
        duration: 20,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 0,
              endTime: 10,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const entities = engine.getEntitiesAtTime(15);

      expect(entities).toHaveLength(0);
    });

    it("handles null endTime as indefinite (uses recording duration)", () => {
      const recording: SimulationRecording = {
        duration: 100,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 0,
              endTime: null,
              startX: 0,
              endX: 100,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);

      // Should still be visible at time 50
      const entities = engine.getEntitiesAtTime(50);
      expect(entities).toHaveLength(1);
      // Interpolation: t = 50/100 = 0.5, x = 0 + (100-0)*0.5 = 50
      expect(entities[0].x).toBe(50);
    });

    it("interpolates angle correctly", () => {
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 0,
              endTime: 10,
              startAngle: 0,
              endAngle: Math.PI,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const entities = engine.getEntitiesAtTime(5);

      expect(entities[0].angle).toBeCloseTo(Math.PI / 2);
    });
  });

  describe("multiple segments", () => {
    it("transitions between segments correctly", () => {
      const recording: SimulationRecording = {
        duration: 20,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 0,
              endTime: 10,
              startX: 0,
              endX: 100,
            }),
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 10,
              endTime: 20,
              startX: 100,
              endX: 200,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);

      // In first segment
      let entities = engine.getEntitiesAtTime(5);
      expect(entities[0].x).toBe(50);

      // At transition point (should be in second segment)
      entities = engine.getEntitiesAtTime(10);
      expect(entities[0].x).toBe(100);

      // In second segment
      entities = engine.getEntitiesAtTime(15);
      expect(entities[0].x).toBe(150);
    });

    it("handles backward seeking (rewind)", () => {
      const recording: SimulationRecording = {
        duration: 20,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 0,
              endTime: 10,
              startX: 0,
              endX: 100,
            }),
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 10,
              endTime: 20,
              startX: 100,
              endX: 200,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);

      // Go forward first
      engine.getEntitiesAtTime(15);

      // Then rewind
      const entities = engine.getEntitiesAtTime(5);
      expect(entities[0].x).toBe(50);
    });
  });

  describe("hierarchy", () => {
    it("builds parent-child relationships", () => {
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              parentId: null,
              startX: 50,
              endX: 50,
            }),
          ],
          box1: [
            createSegment({
              entityId: "box1",
              entityType: "box",
              parentId: "agv1",
              startX: 0,
              endX: 0,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const entities = engine.getEntitiesAtTime(5);

      // Should have one root entity (agv1)
      expect(entities).toHaveLength(1);
      expect(entities[0].entityId).toBe("agv1");

      // Box should be a child of agv1
      expect(entities[0].children).toHaveLength(1);
      expect(entities[0].children[0].entityId).toBe("box1");
    });

    it("treats entity as root when parent is not rendered", () => {
      const recording: SimulationRecording = {
        duration: 20,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 0,
              endTime: 5, // AGV disappears at time 5
            }),
          ],
          box1: [
            createSegment({
              entityId: "box1",
              entityType: "box",
              parentId: "agv1",
              startTime: 0,
              endTime: 15, // Box stays until time 15
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);

      // At time 3, both are visible, box is child of agv
      let entities = engine.getEntitiesAtTime(3);
      expect(entities).toHaveLength(1);
      expect(entities[0].entityId).toBe("agv1");
      expect(entities[0].children[0].entityId).toBe("box1");

      // At time 10, only box is visible, becomes root
      entities = engine.getEntitiesAtTime(10);
      expect(entities).toHaveLength(1);
      expect(entities[0].entityId).toBe("box1");
      expect(entities[0].children).toHaveLength(0);
    });
  });

  describe("resetCache", () => {
    it("allows correct calculation after cache reset", () => {
      const recording: SimulationRecording = {
        duration: 20,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 0,
              endTime: 10,
              startX: 0,
              endX: 100,
            }),
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 10,
              endTime: 20,
              startX: 100,
              endX: 200,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);

      // Go to second segment
      engine.getEntitiesAtTime(15);

      // Reset cache
      engine.resetCache();

      // Jump to first segment - should work correctly
      const entities = engine.getEntitiesAtTime(5);
      expect(entities[0].x).toBe(50);
    });
  });

  describe("multiple entities", () => {
    it("handles multiple independent entities", () => {
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startX: 0,
              endX: 100,
            }),
          ],
          agv2: [
            createSegment({
              entityId: "agv2",
              entityType: "agv",
              startX: 200,
              endX: 300,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const entities = engine.getEntitiesAtTime(5);

      expect(entities).toHaveLength(2);

      const agv1 = entities.find((e) => e.entityId === "agv1");
      const agv2 = entities.find((e) => e.entityId === "agv2");

      expect(agv1?.x).toBe(50);
      expect(agv2?.x).toBe(250);
    });
  });

  describe("getBoundingBox", () => {
    it("returns Infinity values when no segments exist (consumers must validate with Number.isFinite)", () => {
      // Edge case: empty recording returns Infinity/-Infinity values
      // Consuming code (e.g., SimulationScene) must check Number.isFinite() before using
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {},
      };
      const engine = new SimulationEngine(recording);
      const bbox = engine.getBoundingBox();

      expect(bbox.minX).toBe(Infinity);
      expect(bbox.minY).toBe(Infinity);
      expect(bbox.maxX).toBe(-Infinity);
      expect(bbox.maxY).toBe(-Infinity);
            
      // Verify this is detectable
      expect(Number.isFinite(bbox.minX)).toBe(false);
    });

    it("calculates bounding box from single segment", () => {
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startX: 10,
              startY: 20,
              endX: 100,
              endY: 200,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const bbox = engine.getBoundingBox();

      expect(bbox.minX).toBe(10);
      expect(bbox.minY).toBe(20);
      expect(bbox.maxX).toBe(100);
      expect(bbox.maxY).toBe(200);
    });

    it("calculates bounding box across multiple segments of same entity", () => {
      const recording: SimulationRecording = {
        duration: 20,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 0,
              endTime: 10,
              startX: 0,
              startY: 0,
              endX: 100,
              endY: 100,
            }),
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startTime: 10,
              endTime: 20,
              startX: 100,
              startY: 100,
              endX: 300,
              endY: 50,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const bbox = engine.getBoundingBox();

      expect(bbox.minX).toBe(0);
      expect(bbox.minY).toBe(0);
      expect(bbox.maxX).toBe(300);
      expect(bbox.maxY).toBe(100);
    });

    it("calculates bounding box across multiple entities", () => {
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startX: -50,
              startY: 10,
              endX: 50,
              endY: 20,
            }),
          ],
          agv2: [
            createSegment({
              entityId: "agv2",
              entityType: "agv",
              startX: 100,
              startY: -30,
              endX: 200,
              endY: 150,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const bbox = engine.getBoundingBox();

      expect(bbox.minX).toBe(-50);
      expect(bbox.minY).toBe(-30);
      expect(bbox.maxX).toBe(200);
      expect(bbox.maxY).toBe(150);
    });

    it("considers both start and end positions for bounds", () => {
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {
          agv1: [
            createSegment({
              entityId: "agv1",
              entityType: "agv",
              startX: 100, // Start is larger than end
              startY: 200,
              endX: 50,
              endY: 25,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const bbox = engine.getBoundingBox();

      // Should capture the full range regardless of direction
      expect(bbox.minX).toBe(50);
      expect(bbox.minY).toBe(25);
      expect(bbox.maxX).toBe(100);
      expect(bbox.maxY).toBe(200);
    });

    it("handles empty segment arrays gracefully", () => {
      const recording: SimulationRecording = {
        duration: 10,
        segments_by_entity: {
          agv1: [],
          agv2: [
            createSegment({
              entityId: "agv2",
              entityType: "agv",
              startX: 10,
              startY: 20,
              endX: 30,
              endY: 40,
            }),
          ],
        },
      };
      const engine = new SimulationEngine(recording);
      const bbox = engine.getBoundingBox();

      expect(bbox.minX).toBe(10);
      expect(bbox.minY).toBe(20);
      expect(bbox.maxX).toBe(30);
      expect(bbox.maxY).toBe(40);
    });
  });
});
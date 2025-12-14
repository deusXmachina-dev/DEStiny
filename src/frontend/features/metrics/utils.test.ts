import { describe, expect, it } from "vitest";

import type { StateMetric } from "./index";
import { calculateStateProportions } from "./utils";

describe("calculateStateProportions", () => {
  it("returns zero proportions for empty data", () => {
    const metric: StateMetric = {
      name: "test",
      type: "state",
      labels: {},
      data: {
        timestamp: [],
        state: [],
        possible_states: ["idle", "moving", "loading"],
      },
    };

    const result = calculateStateProportions(metric, 100);

    expect(result).toEqual([
      { state: "idle", duration: 0, proportion: 0 },
      { state: "moving", duration: 0, proportion: 0 },
      { state: "loading", duration: 0, proportion: 0 },
    ]);
  });

  it("calculates proportions for a single state", () => {
    const metric: StateMetric = {
      name: "test",
      type: "state",
      labels: {},
      data: {
        timestamp: [0],
        state: ["idle"],
        possible_states: ["idle", "moving"],
      },
    };

    const result = calculateStateProportions(metric, 100);

    expect(result).toEqual([
      { state: "idle", duration: 100, proportion: 1 },
      { state: "moving", duration: 0, proportion: 0 },
    ]);
  });

  it("calculates proportions for multiple state changes", () => {
    const metric: StateMetric = {
      name: "test",
      type: "state",
      labels: {},
      data: {
        timestamp: [0, 20, 50],
        state: ["idle", "moving", "idle"],
        possible_states: ["idle", "moving"],
      },
    };

    const result = calculateStateProportions(metric, 100);

    // idle: 0-20 (20) + 50-100 (50) = 70
    // moving: 20-50 (30) = 30
    expect(result).toEqual([
      { state: "idle", duration: 70, proportion: 0.7 },
      { state: "moving", duration: 30, proportion: 0.3 },
    ]);
  });

  it("stops at currentTime when it's before the end", () => {
    const metric: StateMetric = {
      name: "test",
      type: "state",
      labels: {},
      data: {
        timestamp: [0, 20, 50],
        state: ["idle", "moving", "idle"],
        possible_states: ["idle", "moving"],
      },
    };

    const result = calculateStateProportions(metric, 30);

    // idle: 0-20 (20) + 20-30 (10) = 30 (but moving state is active at 20)
    // Actually, at timestamp 20, state changes to "moving", so:
    // idle: 0-20 (20)
    // moving: 20-30 (10)
    expect(result).toEqual([
      { state: "idle", duration: 20, proportion: 20 / 30 },
      { state: "moving", duration: 10, proportion: 10 / 30 },
    ]);
  });

  it("handles currentTime before first state change", () => {
    const metric: StateMetric = {
      name: "test",
      type: "state",
      labels: {},
      data: {
        timestamp: [10],
        state: ["idle"],
        possible_states: ["idle", "moving"],
      },
    };

    const result = calculateStateProportions(metric, 5);

    // No state changes before currentTime, so all states have 0 duration
    expect(result).toEqual([
      { state: "idle", duration: 0, proportion: 0 },
      { state: "moving", duration: 0, proportion: 0 },
    ]);
  });

  it("handles zero currentTime", () => {
    const metric: StateMetric = {
      name: "test",
      type: "state",
      labels: {},
      data: {
        timestamp: [0],
        state: ["idle"],
        possible_states: ["idle", "moving"],
      },
    };

    const result = calculateStateProportions(metric, 0);

    expect(result).toEqual([
      { state: "idle", duration: 0, proportion: 0 },
      { state: "moving", duration: 0, proportion: 0 },
    ]);
  });

  it("handles three states with multiple transitions", () => {
    const metric: StateMetric = {
      name: "test",
      type: "state",
      labels: {},
      data: {
        timestamp: [0, 10, 25, 40],
        state: ["idle", "moving", "loading", "idle"],
        possible_states: ["idle", "moving", "loading"],
      },
    };

    const result = calculateStateProportions(metric, 60);

    // idle: 0-10 (10) + 40-60 (20) = 30
    // moving: 10-25 (15) = 15
    // loading: 25-40 (15) = 15
    expect(result).toEqual([
      { state: "idle", duration: 30, proportion: 0.5 },
      { state: "moving", duration: 15, proportion: 0.25 },
      { state: "loading", duration: 15, proportion: 0.25 },
    ]);
  });

  it("normalizes proportions to sum to 100% when there are gaps", () => {
    const metric: StateMetric = {
      name: "test",
      type: "state",
      labels: {},
      data: {
        // First timestamp is at 10, creating a gap from 0-10 that's not accounted for
        // Total time is 100, but only 90 is accounted for (10-100)
        timestamp: [10, 30, 50],
        state: ["idle", "loading", "idle"],
        possible_states: ["idle", "moving", "loading"],
      },
    };

    const result = calculateStateProportions(metric, 100);

    // idle: 10-30 (20) + 50-100 (50) = 70
    // loading: 30-50 (20) = 20
    // moving: 0
    // Total accounted time: 90 (gap from 0-10 is not accounted for)
    // Proportions should normalize to sum to 100% based on accounted time
    expect(result).toEqual([
      { state: "idle", duration: 70, proportion: 70 / 90 },
      { state: "moving", duration: 0, proportion: 0 },
      { state: "loading", duration: 20, proportion: 20 / 90 },
    ]);

    // Assert that proportions sum to 1.0 (100%)
    const sumOfProportions = result.reduce(
      (sum, r) => sum + r.proportion,
      0,
    );
    expect(sumOfProportions).toBeCloseTo(1.0, 10);
  });
});

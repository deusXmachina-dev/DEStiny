import type { StateMetricData, TimeSeriesMetricData } from "./index";

/**
 * Transform time-series metric data from parallel arrays to Recharts format.
 * @param metric - The metric with timestamp and value arrays
 * @returns Array of objects with timestamp and value properties
 */
export function transformTimeSeriesMetricData(metric: {
  data: TimeSeriesMetricData;
}): Array<{ timestamp: number; value: number }> {
  const { timestamp, value } = metric.data;
  return timestamp
    .map((t, i) => {
      const val = value[i];
      return val !== undefined ? { timestamp: t, value: val } : null;
    })
    .filter((item): item is { timestamp: number; value: number } => item !== null);
}

/**
 * Calculate the proportion of time spent in each state up to the current time.
 * @param metric - The state metric with timestamp and state arrays
 * @param currentTime - The current playback time (up to which to calculate proportions)
 * @param totalDuration - The total duration of the simulation
 * @returns Array of objects with state, duration, and proportion for each state
 */
export function calculateStateProportions(
  metric: { data: StateMetricData },
  currentTime: number,
): Array<{ state: string; duration: number; proportion: number }> {
  const { timestamp, state, possible_states } = metric.data;

  if (timestamp.length === 0 || state.length === 0) {
    // Return all possible states with 0 duration
    return possible_states.map((s) => ({
      state: s,
      duration: 0,
      proportion: 0,
    }));
  }

  // Calculate duration for each state
  const stateDurations = new Map<string, number>();
  possible_states.forEach((s) => stateDurations.set(s, 0));

  // Iterate through state changes
  for (let i = 0; i < timestamp.length; i++) {
    const currentTimestamp = timestamp[i];
    const currentState = state[i];

    if (currentTimestamp === undefined || currentState === undefined) {
      continue; // Skip invalid entries
    }

    if (currentTimestamp > currentTime) {
      break; // Stop if we've passed the current time
    }

    // Calculate duration until next change or currentTime
    let nextTimestamp: number;
    if (i < timestamp.length - 1) {
      // Next state change exists
      const nextTimestampValue = timestamp[i + 1];
      if (nextTimestampValue !== undefined) {
        nextTimestamp = Math.min(nextTimestampValue, currentTime);
      } else {
        nextTimestamp = currentTime;
      }
    } else {
      // This is the last state change, continue until currentTime
      nextTimestamp = currentTime;
    }

    const duration = nextTimestamp - currentTimestamp;

    if (duration > 0) {
      const currentDuration = stateDurations.get(currentState) || 0;
      stateDurations.set(currentState, currentDuration + duration);
    }
  }

  let totalTime = 0;
  for (const duration of stateDurations.values()) {
    totalTime += duration;
  }

  // Convert to array with proportions
  return possible_states.map((s) => {
    const duration = stateDurations.get(s) || 0;
    const proportion = totalTime > 0 ? duration / totalTime : 0;
    return {
      state: s,
      duration,
      proportion,
    };
  });
}

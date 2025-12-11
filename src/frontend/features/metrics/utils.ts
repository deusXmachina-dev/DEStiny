import type { MetricData } from "./index";

/**
 * Transform metric data from parallel arrays to Recharts format.
 * @param metric - The metric with timestamp and value arrays
 * @returns Array of objects with timestamp and value properties
 */
export function transformMetricData(metric: {
  data: MetricData;
}): Array<{ timestamp: number; value: number }> {
  const { timestamp, value } = metric.data;
  return timestamp
    .map((t, i) => {
      const val = value[i];
      return val !== undefined ? { timestamp: t, value: val } : null;
    })
    .filter(
      (item): item is { timestamp: number; value: number } => item !== null,
    );
}

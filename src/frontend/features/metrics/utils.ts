/**
 * Transform metric data from parallel arrays to Recharts format.
 * @param metric - The metric with timestamp and value arrays
 * @returns Array of objects with timestamp and value properties
 */
export function transformMetricData(metric: {
  data: { timestamp: number[]; value: number[] };
}): Array<{ timestamp: number; value: number }> {
  const { timestamp, value } = metric.data;
  return timestamp.map((t, i) => ({
    timestamp: t,
    value: value[i],
  }));
}

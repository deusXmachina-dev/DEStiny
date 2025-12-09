import { useMemo } from "react";

import { Metric } from "../types";
import { transformMetricData } from "../utils";

interface UseMetricDataProps {
  metric: Metric;
  currentTime: number;
}

interface UseMetricDataReturn {
  chartData: Array<{ timestamp: number; value: number }>;
  visibleData: Array<{ timestamp: number; value: number }>;
}

/**
 * Hook to transform metric data and calculate visible data based on current time.
 * Handles data transformation from parallel arrays to chart format and filters
 * data points based on the current playback time.
 */
export function useMetricData({
  metric,
  currentTime,
}: UseMetricDataProps): UseMetricDataReturn {
  // Transform data from parallel arrays to Recharts format
  const chartData = useMemo(() => transformMetricData(metric), [metric]);

  // Calculate visible data based on current time
  const visibleData = useMemo(() => {
    let data = chartData.filter((point) => point.timestamp <= currentTime);
    if (data.length === 0) {
      data = [chartData[0]];
    }
    return data;
  }, [chartData, currentTime]);

  return { chartData, visibleData };
}

import { useMemo } from "react";

import type { TimeSeriesMetric } from "../index";
import { transformTimeSeriesMetricData } from "../utils";

interface UseMetricDataProps {
  metric: TimeSeriesMetric;
  currentTime: number;
}

interface UseMetricDataReturn {
  chartData: Array<{ timestamp: number; value: number }>;
  visibleData: Array<{ timestamp: number; value: number }>;
}

/**
 * Hook to transform time-series metric data and calculate visible data based on current time.
 * Handles data transformation from parallel arrays to chart format and filters
 * data points based on the current playback time.
 */
export function useTimeSeriesMetricData({
  metric,
  currentTime,
}: UseMetricDataProps): UseMetricDataReturn {
  // Transform data from parallel arrays to Recharts format
  const chartData = useMemo(() => transformTimeSeriesMetricData(metric), [metric]);

  // Calculate visible data based on current time
  const visibleData = useMemo(() => {
    let data = chartData.filter((point) => point.timestamp <= currentTime);
    if (data.length === 0) {
      const firstDataPoint = chartData[0];
      if (firstDataPoint) {
        data = [firstDataPoint];
      }
    }
    return data;
  }, [chartData, currentTime]);

  return { chartData, visibleData };
}

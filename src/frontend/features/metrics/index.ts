export { MetricsPanel } from "./components/MetricsPanel";
export { MetricsProvider, useMetrics } from "./hooks";
import type { components } from "@/types/api";

export type TimeSeriesMetric = components["schemas"]["Metric_TimeSeriesMetricData_"];
export type TimeSeriesMetricData = components["schemas"]["TimeSeriesMetricData"];
export type StateMetric = components["schemas"]["Metric_StateMetricData_"];
export type StateMetricData = components["schemas"]["StateMetricData"];
export type MetricsSchema = components["schemas"]["MetricsSchema"];
export type Metric = TimeSeriesMetric | StateMetric;

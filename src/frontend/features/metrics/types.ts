export type MetricType = "gauge" | "counter" | "sample";

/*
Example metrics:
gauge - number of people in the queue
counter - number of packages delivered
sample - package delivery time
*/

export interface MetricData {
  timestamp: number[];
  value: number[];
}

export interface Metric {
  name: string;
  type: MetricType | string;
  labels: Record<string, string>;
  data: MetricData;
}

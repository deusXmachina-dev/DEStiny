export type MetricType = "gauge" | "counter" | "sample";

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
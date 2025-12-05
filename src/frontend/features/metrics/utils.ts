/**
 * Format a timestamp in seconds to a human-readable time string.
 * @param seconds - The timestamp in seconds
 * @returns Formatted string as "MM:SS" or "HH:MM:SS"
 */
export function formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Transform metric data from parallel arrays to Recharts format.
 * @param metric - The metric with timestamp and value arrays
 * @returns Array of objects with timestamp and value properties
 */
export function transformMetricData(metric: { data: { timestamp: number[], value: number[] } }): Array<{ timestamp: number, value: number }> {
    const { timestamp, value } = metric.data;
    return timestamp.map((t, i) => ({
        timestamp: t,
        value: value[i]
    }));
}

import { SimulationRecording } from "./types";

/**
 * Linear interpolation helper.
 */
export const lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
};

/**
 * Format time as MM:SS
 */
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Parse and validate a simulation recording from JSON string.
 */
export const parseRecording = (content: string): SimulationRecording | null => {
    try {
        const parsed = JSON.parse(content);
        return parsed as SimulationRecording;
    } catch (error) {
        console.error("Failed to parse recording:", error);
        return null;
    }
};


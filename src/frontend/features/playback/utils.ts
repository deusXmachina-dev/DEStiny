import { SimulationRecording } from "./types";
/**
 * Format time as MM:SS
 */
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Parse a JSON string into a SimulationRecording.
 * Returns null if parsing fails.
 */
export const parseRecording = (content: string): SimulationRecording | null => {
    try {
        const parsed = JSON.parse(content);
        // Basic validation
        if (typeof parsed.duration !== "number" || !parsed.segments_by_entity) {
            console.error("Invalid recording format");
            return null;
        }
        return parsed as SimulationRecording;
    } catch (error) {
        console.error("Failed to parse recording:", error);
        return null;
    }
};


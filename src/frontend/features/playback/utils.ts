import { SimulationRecording } from "./types";

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


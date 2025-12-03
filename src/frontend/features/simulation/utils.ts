import { SimulationRecording, BoundingBox } from "./types";

/**
 * Linear interpolation helper.
 */
export const lerp = (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
};

/**
 * Calculate the scene offset to center content based on bounding box.
 * Returns { offsetX: 0, offsetY: 0 } if bounding box is invalid or null.
 */
export const calculateSceneOffset = (
    boundingBox: BoundingBox | null,
    screenWidth: number,
    screenHeight: number
): { offsetX: number; offsetY: number } => {
    // Only apply offset if bounding box has valid (finite) values
    const hasValidBounds = boundingBox && 
        Number.isFinite(boundingBox.minX) && 
        Number.isFinite(boundingBox.maxX);
    
    if (!hasValidBounds) {
        return { offsetX: 0, offsetY: 0 };
    }

    const contentCenterX = (boundingBox.minX + boundingBox.maxX) / 2;
    const contentCenterY = (boundingBox.minY + boundingBox.maxY) / 2;
    const offsetX = (screenWidth / 2) - contentCenterX;
    const offsetY = (screenHeight / 2) - contentCenterY;

    return { offsetX, offsetY };
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


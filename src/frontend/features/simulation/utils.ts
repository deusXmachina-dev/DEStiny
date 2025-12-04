import type { BoundingBox } from "@features/playback";

/**
 * Linear interpolation between two values.
 */
export const lerp = (start: number, end: number, t: number): number => start + (end - start) * t;


/**
 * Calculate the offset needed to center the scene in the viewport.
 */
export const calculateSceneOffset = (
    boundingBox: BoundingBox | null,
    screenWidth: number,
    screenHeight: number
): { offsetX: number; offsetY: number } => {
    if (!boundingBox) {
        return { offsetX: 0, offsetY: 0 };
    }

    const { minX, minY, maxX, maxY } = boundingBox;
    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;

    // Center the bounding box in the screen
    const offsetX = (screenWidth - worldWidth) / 2 - minX;
    const offsetY = (screenHeight - worldHeight) / 2 - minY;

    return { offsetX, offsetY };
};


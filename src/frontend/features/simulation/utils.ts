/**
 * Linear interpolation between two values.
 */
export const lerp = (start: number, end: number, t: number): number => start + (end - start) * t;

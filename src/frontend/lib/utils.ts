import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format time as MM:SS
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Utility function to set different default values for development and production
 */
export const setDefaultWithDevOverride = (
  productionValue: any,
  developmentValue: any,
): any => {
  if (process.env.NODE_ENV === "development") {
    return developmentValue;
  }
  return productionValue;
};

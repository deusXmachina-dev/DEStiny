"use client";

import { extend } from "@pixi/react";
import { Graphics as PixiGraphics } from "pixi.js";

import type { ProgressData } from "../../types";

// Extend Pixi.js components for @pixi/react
extend({
  Graphics: PixiGraphics,
});

interface ProgressBarProps {
  progress: ProgressData;
}

/**
 * ProgressBar - Renders a progress bar above an entity.
 * Features rounded corners, gradients, shadows, and smooth visual design.
 */
export const ProgressBar = ({ progress }: ProgressBarProps) => {
  const { value, minValue, maxValue } = progress;

  // Calculate normalized progress (0-1)
  const normalized = (value - minValue) / (maxValue - minValue);
  const clamped = Math.max(0, Math.min(1, normalized));

  // Dimensions
  const width = 70;
  const height = 8;
  const cornerRadius = 4;
  const x = -width / 2;
  const y = -52; // Position above entity

  return (
    <pixiGraphics
      draw={(g) => {
        // Clear previous drawing
        g.clear();

        // Draw drop shadow (offset background)
        g.roundRect(x + 1, y + 1, width, height, cornerRadius);
        g.fill({ color: 0x000000, alpha: 0.3 });

        // Draw background with rounded corners
        g.roundRect(x, y, width, height, cornerRadius);
        g.fill({ color: 0x1a1a1a, alpha: 0.95 });

        // Draw subtle inner border
        g.roundRect(x + 0.5, y + 0.5, width - 1, height - 1, cornerRadius - 0.5);
        g.stroke({ color: 0x2a2a2a, width: 1, alpha: 0.6 });

        // Draw progress fill with rounded corners
        if (clamped > 0) {
          const fillWidth = width * clamped;

          // Main progress fill - gradient effect using two colors
          // Draw base fill
          g.roundRect(x, y, fillWidth, height, cornerRadius);
          g.fill({ color: 0x3b82f6, alpha: 1.0 }); // blue-500

          // Add highlight gradient effect (lighter top portion)
          const highlightHeight = height * 0.4;
          g.roundRect(x, y, fillWidth, highlightHeight, cornerRadius);
          g.fill({ color: 0x60a5fa, alpha: 0.6 }); // blue-400

          // Add subtle inner glow
          g.roundRect(x + 1, y + 1, fillWidth - 2, height - 2, cornerRadius - 1);
          g.stroke({ color: 0x93c5fd, width: 0.5, alpha: 0.4 }); // blue-300
        }
      }}
    />
  );
};

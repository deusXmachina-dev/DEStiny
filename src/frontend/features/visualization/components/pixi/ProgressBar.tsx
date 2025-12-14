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
 * Shows a filled rectangle representing progress from minValue to maxValue.
 */
export const ProgressBar = ({ progress }: ProgressBarProps) => {
  const { value, minValue, maxValue } = progress;

  // Calculate normalized progress (0-1)
  const normalized = (value - minValue) / (maxValue - minValue);
  const clamped = Math.max(0, Math.min(1, normalized));

  return (
    <pixiGraphics
      // eslint-disable-next-line react/no-unknown-property
      draw={(g) => {
        // Clear previous drawing
        g.clear();

        // Draw background
        g.rect(-30, -50, 60, 6);
        g.fill({ color: 0x333333, alpha: 0.8 });

        // Draw progress fill
        const fillWidth = 60 * clamped;
        g.rect(-30, -50, fillWidth, 6);
        g.fill({ color: 0x4ade80, alpha: 0.9 }); // green-400
      }}
    />
  );
};

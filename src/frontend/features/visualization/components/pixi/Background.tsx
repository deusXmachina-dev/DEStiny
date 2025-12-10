"use client";

import { extend } from "@pixi/react";
import { Graphics } from "pixi.js";
import { useCallback } from "react";

import { SimulationTheme, THEME_CONFIGS } from "../../constants";
import { useVisualization } from "../../hooks/VisualizationContext";

extend({ Graphics });

interface BackgroundProps {
  theme?: SimulationTheme;
}

export const Background = ({ theme = "factory" }: BackgroundProps) => {
  const { screenSize, zoom, scrollOffset } = useVisualization();
  const config = THEME_CONFIGS[theme];

  const draw = useCallback(
    (g: Graphics) => {
      g.clear();

      const { width, height } = screenSize;

      // Calculate visible area in world coordinates
      // The transformed container applies scrollOffset and zoom, so:
      // worldX = (screenX - scrollOffset.x) / zoom
      const worldLeft = -scrollOffset.x / zoom;
      const worldTop = -scrollOffset.y / zoom;
      const worldRight = worldLeft + width / zoom;
      const worldBottom = worldTop + height / zoom;

      // Add padding to ensure we cover the edges when zooming/panning
      const padding = config.tileSize * 2;
      const startX = Math.floor((worldLeft - padding) / config.tileSize);
      const endX = Math.ceil((worldRight + padding) / config.tileSize);
      const startY = Math.floor((worldTop - padding) / config.tileSize);
      const endY = Math.ceil((worldBottom + padding) / config.tileSize);

      // Draw checkerboard tiles covering the visible area
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          g.rect(
            x * config.tileSize,
            y * config.tileSize,
            config.tileSize,
            config.tileSize
          );
          g.fill((x + y) % 2 === 0 ? config.tile : config.tileAlt);
        }
      }

      // Draw grid lines
      g.setStrokeStyle({ width: 2, color: config.grid });
      for (let x = startX; x <= endX; x++) {
        g.moveTo(x * config.tileSize, startY * config.tileSize);
        g.lineTo(x * config.tileSize, endY * config.tileSize);
      }
      for (let y = startY; y <= endY; y++) {
        g.moveTo(startX * config.tileSize, y * config.tileSize);
        g.lineTo(endX * config.tileSize, y * config.tileSize);
      }
      g.stroke();
    },
    [config, screenSize, zoom, scrollOffset]
  );

  return <pixiGraphics draw={draw} />;
};

export default Background;

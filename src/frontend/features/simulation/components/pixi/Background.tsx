"use client";

import { extend, useApplication } from "@pixi/react";
import { Graphics } from "pixi.js";
import { useCallback } from "react";

import { SimulationTheme,THEME_CONFIGS } from "../../constants";

extend({ Graphics });

interface BackgroundProps {
    theme?: SimulationTheme;
}

export const Background = ({
    theme = "factory",
}: BackgroundProps) => {
    const { app } = useApplication();
    const config = THEME_CONFIGS[theme];

    const draw = useCallback(
        (g: Graphics) => {
            g.clear();
            
            const { width } = app.screen;
            const { height } = app.screen;

            const tilesX = Math.ceil(width / config.tileSize) + 1;
            const tilesY = Math.ceil(height / config.tileSize) + 1;

            // Draw checkerboard tiles
            for (let y = 0; y < tilesY; y++) {
                for (let x = 0; x < tilesX; x++) {
                    g.rect(x * config.tileSize, y * config.tileSize, config.tileSize, config.tileSize);
                    g.fill((x + y) % 2 === 0 ? config.tile : config.tileAlt);
                }
            }

            // Draw grid lines
            g.setStrokeStyle({ width: 2, color: config.grid });
            for (let x = 0; x <= tilesX; x++) {
                g.moveTo(x * config.tileSize, 0);
                g.lineTo(x * config.tileSize, height);
            }
            for (let y = 0; y <= tilesY; y++) {
                g.moveTo(0, y * config.tileSize);
                g.lineTo(width, y * config.tileSize);
            }
            g.stroke();
        },
        [config, app]
    );

    return <pixiGraphics draw={draw} />;
};

export default Background;


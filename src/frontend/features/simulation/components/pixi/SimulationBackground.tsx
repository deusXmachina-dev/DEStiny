import { extend, useApplication } from "@pixi/react";
import { Graphics } from "pixi.js";
import { useCallback } from "react";
import { LayoutTheme, THEME_COLORS } from "../../constants";

extend({ Graphics });

interface SimulationBackgroundProps {
    theme?: LayoutTheme;
    gridSize?: number;
}

export const SimulationBackground = ({
    theme = "factory",
    gridSize = 50,
}: SimulationBackgroundProps) => {
    const { app } = useApplication();
    const colors = THEME_COLORS[theme];

    const draw = useCallback(
        (g: Graphics) => {
            g.clear();

            const width = app.screen.width;
            const height = app.screen.height;
            const tilesX = Math.ceil(width / gridSize) + 1;
            const tilesY = Math.ceil(height / gridSize) + 1;

            // Draw checkerboard tiles
            for (let y = 0; y < tilesY; y++) {
                for (let x = 0; x < tilesX; x++) {
                    g.rect(x * gridSize, y * gridSize, gridSize, gridSize);
                    g.fill((x + y) % 2 === 0 ? colors.tile : colors.tileAlt);
                }
            }

            // Draw grid lines
            g.setStrokeStyle({ width: 2, color: colors.grid });
            for (let x = 0; x <= tilesX; x++) {
                g.moveTo(x * gridSize, 0);
                g.lineTo(x * gridSize, height);
            }
            for (let y = 0; y <= tilesY; y++) {
                g.moveTo(0, y * gridSize);
                g.lineTo(width, y * gridSize);
            }
            g.stroke();
        },
        [app, colors, gridSize]
    );

    return <pixiGraphics draw={draw} />;
};

export default SimulationBackground;


import { extend, useApplication } from "@pixi/react";
import { Graphics } from "pixi.js";
import { useCallback } from "react";

extend({ Graphics });

export type LayoutTheme = "factory" | "office" | "warehouse" | "hospital";

const THEME_COLORS = {
    factory: { tile: 0x4a4a4a, tileAlt: 0x525252, grid: 0x3a3a3a },
    office: { tile: 0x8b9dc3, tileAlt: 0x7a8cb2, grid: 0x6b7ca2 },
    warehouse: { tile: 0x6b5b4f, tileAlt: 0x5a4a3e, grid: 0x4a3a2e },
    hospital: { tile: 0x8b9dc3, tileAlt: 0x7a8cb2, grid: 0x6b7ca2 },
};

interface LayoutBackgroundProps {
    theme?: LayoutTheme;
    gridSize?: number;
}

export const LayoutBackground = ({
    theme = "factory",
    gridSize = 50,
}: LayoutBackgroundProps) => {
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

export default LayoutBackground;

import { extend, useApplication } from "@pixi/react";
import { Graphics } from "pixi.js";
import { useCallback } from "react";

extend({ Graphics });

// Industrial factory floor colors
const TILE_COLOR = 0x4a4a4a; // Dark concrete gray
const TILE_ALT_COLOR = 0x525252; // Slightly lighter gray for variation
const GRID_LINE_COLOR = 0x3a3a3a; // Darker grid lines
const ACCENT_LINE_COLOR = 0x5a5a5a; // Lighter accent lines

const TILE_SIZE = 64;
const GRID_LINE_WIDTH = 2;

export const FactoryBackground = () => {
    const { app } = useApplication();

    const draw = useCallback(
        (g: Graphics) => {
            g.clear();

            const width = app.screen.width;
            const height = app.screen.height;

            // Calculate number of tiles needed
            const tilesX = Math.ceil(width / TILE_SIZE) + 1;
            const tilesY = Math.ceil(height / TILE_SIZE) + 1;

            // Draw base tiles with alternating colors (checkerboard pattern)
            for (let y = 0; y < tilesY; y++) {
                for (let x = 0; x < tilesX; x++) {
                    const isAlternate = (x + y) % 2 === 0;
                    const tileColor = isAlternate ? TILE_COLOR : TILE_ALT_COLOR;

                    g.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    g.fill(tileColor);
                }
            }

            // Draw grid lines
            g.setStrokeStyle({ width: GRID_LINE_WIDTH, color: GRID_LINE_COLOR });

            // Vertical lines
            for (let x = 0; x <= tilesX; x++) {
                g.moveTo(x * TILE_SIZE, 0);
                g.lineTo(x * TILE_SIZE, height);
            }

            // Horizontal lines
            for (let y = 0; y <= tilesY; y++) {
                g.moveTo(0, y * TILE_SIZE);
                g.lineTo(width, y * TILE_SIZE);
            }

            g.stroke();

            // Draw accent lines (every 4 tiles for larger grid sections)
            g.setStrokeStyle({ width: GRID_LINE_WIDTH + 1, color: ACCENT_LINE_COLOR });

            const majorGridSize = TILE_SIZE * 4;

            // Major vertical lines
            for (let x = 0; x <= Math.ceil(width / majorGridSize); x++) {
                g.moveTo(x * majorGridSize, 0);
                g.lineTo(x * majorGridSize, height);
            }

            // Major horizontal lines
            for (let y = 0; y <= Math.ceil(height / majorGridSize); y++) {
                g.moveTo(0, y * majorGridSize);
                g.lineTo(width, y * majorGridSize);
            }

            g.stroke();

            // Add subtle corner markers at major grid intersections
            const markerSize = 8;
            g.setStrokeStyle({ width: 1, color: 0x666666 });

            for (let y = 0; y <= Math.ceil(height / majorGridSize); y++) {
                for (let x = 0; x <= Math.ceil(width / majorGridSize); x++) {
                    const cx = x * majorGridSize;
                    const cy = y * majorGridSize;

                    // Draw small cross markers
                    g.moveTo(cx - markerSize, cy);
                    g.lineTo(cx + markerSize, cy);
                    g.moveTo(cx, cy - markerSize);
                    g.lineTo(cx, cy + markerSize);
                }
            }

            g.stroke();
        },
        [app.screen.width, app.screen.height]
    );

    return <pixiGraphics draw={draw} />;
};


import { SimulationEntityType } from "@features/playback";

/**
 * Asset URL mapping for entity types.
 */
export const ASSET_MAP: Record<string, string> = {
    agv: "/assets/agv.png",
    robot: "/assets/robot.png",
    box: "/assets/box.png",
    palette: "/assets/palette.png",
    human: "/assets/human.png",
    counter: "/assets/counter.png",
} satisfies Partial<Record<SimulationEntityType, string>>;

/**
 * Background theme configuration.
 */
export type SimulationTheme = "factory" | "warehouse" | "clean" | "dark";

export interface ThemeConfig {
    tile: number;
    tileAlt: number;
    grid: number;
    tileSize: number;
}

export const THEME_CONFIGS: Record<SimulationTheme, ThemeConfig> = {
    factory: {
        tile: 0x4a5568,
        tileAlt: 0x3d4452,
        grid: 0x2d3748,
        tileSize: 64,
    },
    warehouse: {
        tile: 0x8b7355,
        tileAlt: 0x7a6548,
        grid: 0x5c4a3a,
        tileSize: 64,
    },
    clean: {
        tile: 0xf7fafc,
        tileAlt: 0xedf2f7,
        grid: 0xe2e8f0,
        tileSize: 64,
    },
    dark: {
        tile: 0x1a202c,
        tileAlt: 0x171923,
        grid: 0x2d3748,
        tileSize: 64,
    },
};


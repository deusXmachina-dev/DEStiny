// Asset mapping for entity types
export const ASSET_MAP: Record<string, string> = {
    agv: "/assets/agv.png",
    robot: "/assets/robot.png",
    box: "/assets/box.png",
    palette: "/assets/palette.png",
    human: "/assets/human.png",
    counter: "/assets/counter.png",
};

// Playback speed options
export const SPEED_OPTIONS = [
    { value: "0.25", label: "0.25x" },
    { value: "0.5", label: "0.5x" },
    { value: "1", label: "1x" },
    { value: "2", label: "2x" },
    { value: "3", label: "3x" },
    { value: "5", label: "5x" },
    { value: "10", label: "10x" },
    { value: "20", label: "20x" },
];

export type SimulationBackgroundTheme = "factory" | "office" | "warehouse" | "hospital";

export const SIMULATION_BACKGROUND_THEME_CONFIGS: Record<SimulationBackgroundTheme, { tile: number; tileAlt: number; grid: number; tileSize: number }> = {
    factory: { tile: 0x4a4a4a, tileAlt: 0x525252, grid: 0x3a3a3a, tileSize: 50 },
    office: { tile: 0x8b9dc3, tileAlt: 0x7a8cb2, grid: 0x6b7ca2, tileSize: 15 },
    warehouse: { tile: 0x6b5b4f, tileAlt: 0x5a4a3e, grid: 0x4a3a2e, tileSize: 40 },
    hospital: { tile: 0x8b9dc3, tileAlt: 0x7a8cb2, grid: 0x6b7ca2, tileSize: 10 },
};


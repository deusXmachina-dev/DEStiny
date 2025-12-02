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
    // Industrial concrete slabs - neutral gray with subtle warmth
    factory: { tile: 0x5c5c5c, tileAlt: 0x666666, grid: 0x484848, tileSize: 60 },
    // Commercial carpet tiles - warm neutral gray/taupe
    office: { tile: 0x7a7672, tileAlt: 0x6e6a66, grid: 0x5e5a56, tileSize: 35 },
    // Epoxy-coated concrete - gray with subtle green-blue industrial tint
    warehouse: { tile: 0x686e6c, tileAlt: 0x727876, grid: 0x585e5c, tileSize: 80 },
    // Vinyl/linoleum flooring - light, clean, sterile appearance
    hospital: { tile: 0xd8dce0, tileAlt: 0xe2e6ea, grid: 0xc4c8cc, tileSize: 20 },
};


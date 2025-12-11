import { SimulationEntityType } from "./types";

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
  source: "/assets/source.png",
  sink: "/assets/sink.png",
  buffer: "/assets/buffer.png",
  manufacturing_cell: "/assets/robot.png",
} satisfies Partial<Record<SimulationEntityType, string>>;

/**
 * Background theme configuration.
 */
export type SimulationTheme = "factory" | "warehouse" | "office" | "hospital";

export interface ThemeConfig {
  tile: number;
  tileAlt: number;
  grid: number;
  tileSize: number;
}

export const THEME_CONFIGS: Record<SimulationTheme, ThemeConfig> = {
  factory: {
    // Industrial concrete slabs - neutral gray with subtle warmth
    tile: 0x5c5c5c,
    tileAlt: 0x666666,
    grid: 0x484848,
    tileSize: 60,
  },
  warehouse: {
    // Epoxy-coated concrete - gray with subtle green-blue industrial tint
    tile: 0x686e6c,
    tileAlt: 0x727876,
    grid: 0x585e5c,
    tileSize: 80,
  },
  office: {
    // Commercial carpet tiles - warm neutral gray/taupe
    tile: 0x7a7672,
    tileAlt: 0x6e6a66,
    grid: 0x5e5a56,
    tileSize: 35,
  },
  hospital: {
    // Vinyl/linoleum flooring - light, clean, sterile appearance
    tile: 0xd8dce0,
    tileAlt: 0xe2e6ea,
    grid: 0xc4c8cc,
    tileSize: 20,
  },
};

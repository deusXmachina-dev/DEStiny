import { Container, Graphics } from "pixi.js";

import { SimulationTheme, THEME_CONFIGS } from "../constants";
import type { ScreenSize, ScrollOffset } from "../types";

/**
 * BackgroundManager - Imperatively manages background graphics without React.
 *
 * This class creates and updates the checkerboard background grid directly,
 * bypassing React reconciliation for better performance during zoom/pan.
 */
export class BackgroundManager {
  private graphics: Graphics;
  private theme: SimulationTheme;
  private lastZoom = 0;
  private lastScrollX = 0;
  private lastScrollY = 0;
  private lastWidth = 0;
  private lastHeight = 0;

  constructor(parentContainer: Container, theme: SimulationTheme = "factory") {
    this.graphics = new Graphics();
    this.theme = theme;
    // Add at index 0 so background renders behind all other children
    parentContainer.addChildAt(this.graphics, 0);
    console.debug("BackgroundManager.constructor: added to parentContainer");
  }

  /**
   * Update the background based on current transform and screen size.
   * Called by SceneManager when zoom/scroll changes.
   */
  update(zoom: number, scrollOffset: ScrollOffset, screenSize: ScreenSize): void {
    const { width, height } = screenSize;

    // Skip if nothing changed
    if (
      zoom === this.lastZoom &&
      scrollOffset.x === this.lastScrollX &&
      scrollOffset.y === this.lastScrollY &&
      width === this.lastWidth &&
      height === this.lastHeight
    ) {
      return;
    }

    // Store current values for comparison
    this.lastZoom = zoom;
    this.lastScrollX = scrollOffset.x;
    this.lastScrollY = scrollOffset.y;
    this.lastWidth = width;
    this.lastHeight = height;

    // Skip if screen size is not set yet
    if (width === 0 || height === 0) {
      console.debug("BackgroundManager.update: skipping, screenSize is 0");
      return;
    }

    console.debug("BackgroundManager.update: drawing with screenSize", width, height);
    this.draw(zoom, scrollOffset, screenSize);
  }

  /**
   * Set the theme and redraw.
   */
  setTheme(theme: SimulationTheme): void {
    if (theme === this.theme) {
      return;
    }
    this.theme = theme;
    // Force redraw by resetting cached values
    this.draw(
      this.lastZoom,
      { x: this.lastScrollX, y: this.lastScrollY },
      {
        width: this.lastWidth,
        height: this.lastHeight,
      },
    );
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.graphics.destroy();
  }

  /**
   * Draw the checkerboard background.
   */
  private draw(zoom: number, scrollOffset: ScrollOffset, screenSize: ScreenSize): void {
    const config = THEME_CONFIGS[this.theme];
    const g = this.graphics;
    const { width, height } = screenSize;

    g.clear();

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
        g.rect(x * config.tileSize, y * config.tileSize, config.tileSize, config.tileSize);
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
  }
}

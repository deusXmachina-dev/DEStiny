import { Container } from "pixi.js";

import { SimulationTheme } from "../constants";
import type { ScreenSize, ScrollOffset } from "../types";
import { BackgroundManager } from "./BackgroundManager";
import type { GetInteractionCallbacksFn, GetTextureFn } from "./EntityManager";
import { EntityManager } from "./EntityManager";

export type TransformListener = (
  zoom: number,
  scrollOffset: ScrollOffset,
) => void;

export interface SceneManagerConfig {
  container: Container;
  theme: SimulationTheme;
  getTexture: GetTextureFn;
  getInteractionCallbacks: GetInteractionCallbacksFn;
  interactive: boolean;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;

/**
 * SceneManager - Imperatively manages scene transform (zoom/pan) without React.
 *
 * This class handles zoom and scroll state, directly updating the PixiJS
 * container's transform properties to avoid React re-renders during
 * high-frequency interactions like panning and zooming.
 *
 * Components that need to react to transform changes can subscribe via
 * the subscribe() method.
 */
export class SceneManager {
  private zoom = 1.0;
  private scrollOffset: ScrollOffset = { x: 0, y: 0 };
  private sceneContainer: Container | null = null;
  private backgroundManager: BackgroundManager | null = null;
  private entityManager: EntityManager | null = null;
  private screenSize: ScreenSize = { width: 0, height: 0 };
  private listeners = new Set<TransformListener>();

  /**
   * Initialize SceneManager with container and sub-managers.
   */
  initialize(config: SceneManagerConfig): void {
    this.setSceneContainer(config.container);

    // Create BackgroundManager
    this.backgroundManager = new BackgroundManager(
      config.container,
      config.theme,
    );

    // Create EntityManager
    this.entityManager = new EntityManager(
      config.container,
      config.getTexture,
      config.getInteractionCallbacks,
      config.interactive,
    );
  }

  /**
   * Set the scene container that this manager controls.
   */
  setSceneContainer(container: Container): void {
    this.sceneContainer = container;
    this.applyTransform();
  }

  /**
   * Get the background manager.
   */
  getBackgroundManager(): BackgroundManager | null {
    return this.backgroundManager;
  }

  /**
   * Get the entity manager.
   */
  getEntityManager(): EntityManager | null {
    return this.entityManager;
  }

  /**
   * Update screen size (needed for background calculations).
   */
  setScreenSize(size: ScreenSize): void {
    this.screenSize = size;
    this.updateBackground();
  }

  /**
   * Get the current zoom level.
   */
  getZoom(): number {
    return this.zoom;
  }

  /**
   * Get the current scroll offset.
   */
  getScrollOffset(): ScrollOffset {
    return { ...this.scrollOffset };
  }

  /**
   * Get the current screen size.
   */
  getScreenSize(): ScreenSize {
    return { ...this.screenSize };
  }

  /**
   * Set the zoom level (clamped to MIN_ZOOM..MAX_ZOOM).
   */
  setZoom(zoom: number): void {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    if (clampedZoom === this.zoom) {
      return;
    }
    this.zoom = clampedZoom;
    this.applyTransform();
    this.updateBackground();
    this.notifyListeners();
  }

  /**
   * Set the scroll offset.
   */
  setScrollOffset(offset: ScrollOffset): void {
    if (offset.x === this.scrollOffset.x && offset.y === this.scrollOffset.y) {
      return;
    }
    this.scrollOffset = { ...offset };
    this.applyTransform();
    this.updateBackground();
    this.notifyListeners();
  }

  /**
   * Set both zoom and scroll offset in a single update (avoids double notifications).
   */
  setTransform(zoom: number, offset: ScrollOffset): void {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    const zoomChanged = clampedZoom !== this.zoom;
    const offsetChanged =
      offset.x !== this.scrollOffset.x || offset.y !== this.scrollOffset.y;

    if (!zoomChanged && !offsetChanged) {
      return;
    }

    this.zoom = clampedZoom;
    this.scrollOffset = { ...offset };
    this.applyTransform();
    this.updateBackground();
    this.notifyListeners();
  }

  /**
   * Reset zoom and scroll to default values.
   */
  reset(): void {
    this.zoom = 1.0;
    this.scrollOffset = { x: 0, y: 0 };
    this.applyTransform();
    this.updateBackground();
    this.notifyListeners();
  }

  /**
   * Convert screen coordinates to world coordinates.
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.scrollOffset.x) / this.zoom,
      y: (screenY - this.scrollOffset.y) / this.zoom,
    };
  }

  /**
   * Convert world coordinates to screen coordinates.
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this.zoom + this.scrollOffset.x,
      y: worldY * this.zoom + this.scrollOffset.y,
    };
  }

  /**
   * Subscribe to transform changes. Returns an unsubscribe function.
   */
  subscribe(listener: TransformListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.backgroundManager?.dispose();
    this.entityManager?.dispose();
    this.listeners.clear();
    this.sceneContainer = null;
    this.backgroundManager = null;
    this.entityManager = null;
  }

  /**
   * Apply current transform to the scene container.
   */
  private applyTransform(): void {
    if (!this.sceneContainer) {
      return;
    }
    this.sceneContainer.scale.set(this.zoom);
    this.sceneContainer.position.set(this.scrollOffset.x, this.scrollOffset.y);
  }

  /**
   * Update the background manager with current state.
   */
  private updateBackground(): void {
    if (!this.backgroundManager) {
      return;
    }
    this.backgroundManager.update(
      this.zoom,
      this.scrollOffset,
      this.screenSize,
    );
  }

  /**
   * Notify all listeners of transform change.
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.zoom, { ...this.scrollOffset });
    }
  }
}

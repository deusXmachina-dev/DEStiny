import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Sprite,
  Text,
  Texture,
} from "pixi.js";

import type { InteractionCallbacks } from "../hooks/VisualizationContext";
import type { ProgressData, SimulationEntityState } from "../types";

export type GetTextureFn = (entityType: string) => Texture;
export type GetInteractionCallbacksFn = () => InteractionCallbacks;

interface DndState {
  target: Container | null;
  offset: { x: number; y: number };
  entityId: string | null;
  isDragging: boolean;
}

const NAME_TEXT_STYLE = {
  fontFamily: "Inter, system-ui, Arial",
  fontSize: 14,
  fontWeight: "600" as const,
  fill: 0xffffff,
  stroke: {
    color: 0x000000,
    width: 2,
    join: "round" as const,
    miterLimit: 2,
  },
  dropShadow: {
    color: 0x000000,
    alpha: 0.35,
    blur: 2,
    distance: 2,
  },
  letterSpacing: 0.5,
  align: "center" as const,
};

const PROGRESS_BAR_CONFIG = {
  width: 70,
  height: 8,
  cornerRadius: 4,
  y: -52, // Position above entity
} as const;

/**
 * EntityManager - Imperatively manages PixiJS entities without React.
 *
 * This class creates, updates, and destroys entity sprites directly,
 * bypassing React reconciliation for better performance during playback.
 */
export class EntityManager {
  private container: Container;
  private entityMap: Map<string, Container> = new Map();
  private getTexture: GetTextureFn;
  private getInteractionCallbacks: GetInteractionCallbacksFn;
  private interactive: boolean;
  private dndState: DndState = {
    target: null,
    offset: { x: 0, y: 0 },
    entityId: null,
    isDragging: false,
  };

  constructor(
    parentContainer: Container,
    getTexture: GetTextureFn,
    getInteractionCallbacks: GetInteractionCallbacksFn,
    interactive: boolean = false,
  ) {
    this.container = new Container();
    parentContainer.addChild(this.container);
    this.getTexture = getTexture;
    this.getInteractionCallbacks = getInteractionCallbacks;
    this.interactive = interactive;
  }

  /**
   * Update all entities based on new state.
   * Adds new entities, removes old ones, and updates positions.
   */
  updateEntities(entities: SimulationEntityState[]): void {
    // Build set of current entity IDs (including nested children)
    const currentIds = this.collectEntityIds(entities);

    // Remove entities that are no longer present
    for (const [entityId, container] of this.entityMap) {
      if (!currentIds.has(entityId)) {
        this.removeEntity(entityId, container);
      }
    }

    // Add or update entities (recursively handles children)
    this.updateEntityTree(entities, this.container);
  }

  /**
   * Get the drag state (for stage-level handlers).
   */
  getDndState(): DndState {
    return this.dndState;
  }

  /**
   * End current drag operation (for stage-level handlers).
   */
  endDrag(): void {
    if (this.dndState.target) {
      this.dndState.target.alpha = 1;
    }
    this.dndState = {
      target: null,
      offset: { x: 0, y: 0 },
      entityId: null,
      isDragging: false,
    };
  }

  /**
   * Clean up all entities and the container.
   */
  dispose(): void {
    for (const [entityId, container] of this.entityMap) {
      this.removeEntity(entityId, container);
    }
    this.container.destroy({ children: true });
  }

  private collectEntityIds(
    entities: SimulationEntityState[],
    ids: Set<string> = new Set(),
  ): Set<string> {
    for (const entity of entities) {
      ids.add(entity.entityId);
      if (entity.children.length > 0) {
        this.collectEntityIds(entity.children, ids);
      }
    }
    return ids;
  }

  private updateEntityTree(
    entities: SimulationEntityState[],
    parent: Container,
  ): void {
    for (const entity of entities) {
      let container = this.entityMap.get(entity.entityId);

      if (!container) {
        // Create new entity
        container = this.createEntity(entity, parent);
        this.entityMap.set(entity.entityId, container);
      } else {
        // Update existing entity position
        container.x = entity.x;
        container.y = entity.y;
        container.rotation = entity.angle;

        // Update name text if it changed
        this.updateNameText(container, entity.name);

        // Update progress bar if it changed
        this.updateProgressBar(container, entity.progress);
      }

      // Recursively update children (they parent to this container)
      if (entity.children.length > 0) {
        this.updateEntityTree(entity.children, container);
      }
    }
  }

  private createEntity(
    entity: SimulationEntityState,
    parent: Container,
  ): Container {
    const container = new Container();
    container.x = entity.x;
    container.y = entity.y;
    container.rotation = entity.angle;

    // Create sprite
    const texture = this.getTexture(entity.entityType);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    container.addChild(sprite);

    // Create name text if present
    if (entity.name) {
      const text = new Text({
        text: entity.name,
        style: NAME_TEXT_STYLE,
      });
      text.anchor.set(0.5);
      text.x = 0;
      text.y = 40;
      text.roundPixels = true;
      text.label = "nameText";
      container.addChild(text);
    }

    // Create progress bar if present
    this.updateProgressBar(container, entity.progress);

    // Set up interactions if enabled
    if (this.interactive) {
      this.setupInteractions(container, entity.entityId);
    }

    parent.addChild(container);
    return container;
  }

  private updateNameText(container: Container, name: string | null): void {
    const existingText = container.children.find(
      (child) => child.label === "nameText",
    ) as Text | undefined;

    if (name) {
      if (existingText) {
        existingText.text = name;
      } else {
        const text = new Text({
          text: name,
          style: NAME_TEXT_STYLE,
        });
        text.anchor.set(0.5);
        text.x = 0;
        text.y = 40;
        text.roundPixels = true;
        text.label = "nameText";
        container.addChild(text);
      }
    } else if (existingText) {
      existingText.destroy();
    }
  }

  private updateProgressBar(
    container: Container,
    progress: ProgressData | null,
  ): void {
    const existingProgressBar = container.children.find(
      (child) => child.label === "progressBar",
    ) as Graphics | undefined;

    if (progress) {
      const { value, minValue, maxValue } = progress;
      const normalized = (value - minValue) / (maxValue - minValue);
      const clamped = Math.max(0, Math.min(1, normalized));

      const { width, height, cornerRadius, y } = PROGRESS_BAR_CONFIG;
      const x = -width / 2;

      const graphics = existingProgressBar ?? new Graphics();
      graphics.label = "progressBar";

      // Clear and redraw
      graphics.clear();

      // Draw drop shadow (offset background)
      graphics.roundRect(x + 1, y + 1, width, height, cornerRadius);
      graphics.fill({ color: 0x000000, alpha: 0.3 });

      // Draw background with rounded corners
      graphics.roundRect(x, y, width, height, cornerRadius);
      graphics.fill({ color: 0x1a1a1a, alpha: 0.95 });

      // Draw subtle inner border
      graphics.roundRect(
        x + 0.5,
        y + 0.5,
        width - 1,
        height - 1,
        cornerRadius - 0.5,
      );
      graphics.stroke({ color: 0x2a2a2a, width: 1, alpha: 0.6 });

      // Draw progress fill with rounded corners
      if (clamped > 0) {
        const fillWidth = width * clamped;

        // Main progress fill - gradient effect using two colors
        // Draw base fill
        graphics.roundRect(x, y, fillWidth, height, cornerRadius);
        graphics.fill({ color: 0x3b82f6, alpha: 1.0 }); // blue-500

        // Add highlight gradient effect (lighter top portion)
        const highlightHeight = height * 0.4;
        graphics.roundRect(x, y, fillWidth, highlightHeight, cornerRadius);
        graphics.fill({ color: 0x60a5fa, alpha: 0.6 }); // blue-400

        // Add subtle inner glow
        graphics.roundRect(
          x + 1,
          y + 1,
          fillWidth - 2,
          height - 2,
          cornerRadius - 1,
        );
        graphics.stroke({ color: 0x93c5fd, width: 0.5, alpha: 0.4 }); // blue-300
      }

      // Add to container if it's new
      if (!existingProgressBar) {
        container.addChild(graphics);
      }
    } else if (existingProgressBar) {
      // Remove progress bar if progress is null
      existingProgressBar.destroy();
    }
  }

  private removeEntity(entityId: string, container: Container): void {
    container.destroy({ children: true });
    this.entityMap.delete(entityId);
  }

  private setupInteractions(container: Container, entityId: string): void {
    const CLICK_THRESHOLD = 5;
    let wasDragging = false;
    let dragStartPos: { x: number; y: number } | null = null;

    container.eventMode = "static";
    container.cursor = "pointer";

    const onPointerDown = (event: FederatedPointerEvent) => {
      if (!container.parent) {
        return;
      }

      dragStartPos = { x: event.global.x, y: event.global.y };
      wasDragging = false;

      const pointerPos = container.parent.toLocal(event.global);
      const offset = {
        x: container.x - pointerPos.x,
        y: container.y - pointerPos.y,
      };

      this.dndState = {
        target: container,
        offset,
        entityId,
        isDragging: true,
      };
      container.alpha = 0.5;
    };

    const onPointerMove = (event: FederatedPointerEvent) => {
      if (!dragStartPos) {
        return;
      }

      const distance = Math.sqrt(
        Math.pow(event.global.x - dragStartPos.x, 2) +
          Math.pow(event.global.y - dragStartPos.y, 2),
      );

      if (distance > CLICK_THRESHOLD) {
        wasDragging = true;
      }
    };

    const onPointerUp = () => {
      dragStartPos = null;
      setTimeout(() => {
        wasDragging = false;
      }, 10);
    };

    const onPointerTap = () => {
      if (!wasDragging && !this.dndState.isDragging) {
        const callbacks = this.getInteractionCallbacks();
        callbacks.onEntityClick?.(entityId);
      }
    };

    container.on("pointerdown", onPointerDown);
    container.on("pointermove", onPointerMove);
    container.on("pointerup", onPointerUp);
    container.on("pointertap", onPointerTap);
  }
}

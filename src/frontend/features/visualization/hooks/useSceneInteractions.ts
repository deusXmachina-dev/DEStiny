"use client";

import { useApplication } from "@pixi/react";
import { FederatedPointerEvent, FederatedWheelEvent } from "pixi.js";
import { useEffect, useRef } from "react";

import { useVisualization } from "./VisualizationContext";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_SENSITIVITY = 0.001;

/**
 * Consolidated hook for all scene-level interactions.
 *
 * Handles:
 * - Wheel events for zooming (zoom to cursor position)
 * - Pinch-to-zoom for touch devices
 * - Drag on empty space for panning
 * - Entity drag move and end (stage-level handlers)
 * - Prevents page scrolling when interacting with canvas
 *
 * Must be used within:
 * - A Pixi Application context (for app.stage)
 * - A VisualizationProvider (for SceneManager and EntityManager)
 */
export const useSceneInteractions = () => {
  const { app } = useApplication();
  const {
    interactive,
    getInteractionCallbacks,
    getSceneManager,
    sceneManagerReady,
  } = useVisualization();

  // Pan state
  const panStateRef = useRef<{
    isPanning: boolean;
    panStartPos: { x: number; y: number } | null;
    panStartOffset: { x: number; y: number } | null;
  }>({
    isPanning: false,
    panStartPos: null,
    panStartOffset: null,
  });

  // Pinch state for mobile/touch pinch-to-zoom
  const pinchStateRef = useRef<{
    isPinching: boolean;
    pointerPositions: Map<number, { x: number; y: number }>;
    startDistance: number;
    startZoom: number;
    centerWorld: { x: number; y: number } | null;
  }>({
    isPinching: false,
    pointerPositions: new Map(),
    startDistance: 0,
    startZoom: 1.0,
    centerWorld: null,
  });

  // Set up all scene interactions
  useEffect(() => {
    // Guard: ensure Pixi app is fully initialized
    // Use optional chaining before destructuring to handle proxy/incomplete objects
    if (
      !app?.stage ||
      !app?.renderer?.screen ||
      !app?.canvas ||
      !sceneManagerReady
    ) {
      return;
    }

    const { stage, renderer, canvas } = app;
    const { screen } = renderer;

    // Setup stage once (handles both zoom/pan and entity drag)
    stage.eventMode = "static";
    stage.hitArea = screen;

    // Helper function to calculate distance between two points
    const getDistance = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
    ): number => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

    // ========== Wheel handling (prevents page scroll + handles zoom) ==========
    const handleCanvasWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Use capture phase to catch event before it bubbles
    canvas.addEventListener("wheel", handleCanvasWheel, {
      passive: false,
      capture: true,
    });

    // ========== Zoom via wheel ==========
    const onWheel = (event: FederatedWheelEvent) => {
      const sceneManager = getSceneManager();
      if (!sceneManager) {
        return;
      }

      // Don't zoom if entity is being dragged
      const entityManager = sceneManager.getEntityManager();
      if (entityManager?.getDndState().isDragging) {
        return;
      }

      // Get current values from SceneManager
      const currentZoom = sceneManager.getZoom();
      const currentScrollOffset = sceneManager.getScrollOffset();

      // Calculate zoom delta
      const zoomDelta = -event.deltaY * ZOOM_SENSITIVITY;
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, currentZoom + zoomDelta),
      );

      if (newZoom === currentZoom) {
        return; // Zoom clamped, no change
      }

      // Get pointer position in screen coordinates
      const pointerScreenX = event.global.x;
      const pointerScreenY = event.global.y;

      // Convert pointer position to world coordinates before zoom
      const worldX = (pointerScreenX - currentScrollOffset.x) / currentZoom;
      const worldY = (pointerScreenY - currentScrollOffset.y) / currentZoom;

      // Calculate new scroll offset to keep the point under cursor fixed
      const newScrollOffset = {
        x: pointerScreenX - worldX * newZoom,
        y: pointerScreenY - worldY * newZoom,
      };

      // Update via SceneManager (single update for both)
      sceneManager.setTransform(newZoom, newScrollOffset);
    };

    // ========== Pan/Pinch start ==========
    const onPointerDown = (event: FederatedPointerEvent) => {
      const sceneManager = getSceneManager();
      if (!sceneManager) {
        return;
      }

      // Don't start pan if entity is already being dragged
      const entityManager = sceneManager.getEntityManager();
      if (entityManager?.getDndState().isDragging) {
        return;
      }
      if (!sceneManager) {
        return;
      }

      const pinchState = pinchStateRef.current;
      const panState = panStateRef.current;

      // Track pointer position
      pinchState.pointerPositions.set(event.pointerId, {
        x: event.global.x,
        y: event.global.y,
      });

      // If we have 2+ pointers, start pinch mode
      if (pinchState.pointerPositions.size >= 2) {
        // Cancel panning if active
        panState.isPanning = false;
        panState.panStartPos = null;
        panState.panStartOffset = null;

        // Initialize pinch on first detection of 2 pointers
        if (pinchState.pointerPositions.size === 2 && !pinchState.isPinching) {
          const pointers = Array.from(pinchState.pointerPositions.values());
          const [p1, p2] = pointers;
          if (!p1 || !p2) {
            return;
          }

          const currentZoom = sceneManager.getZoom();
          const currentScrollOffset = sceneManager.getScrollOffset();

          pinchState.isPinching = true;
          pinchState.startZoom = currentZoom;
          pinchState.startDistance = getDistance(p1, p2);

          // Calculate center point in screen coordinates
          const centerScreenX = (p1.x + p2.x) / 2;
          const centerScreenY = (p1.y + p2.y) / 2;

          // Convert to world coordinates
          pinchState.centerWorld = {
            x: (centerScreenX - currentScrollOffset.x) / currentZoom,
            y: (centerScreenY - currentScrollOffset.y) / currentZoom,
          };
        }
        return;
      }

      // Single pointer - check if we should start panning
      // Only start panning on left mouse button (button === 0 or undefined)
      if (event.button !== 0 && event.button !== undefined) {
        return;
      }

      // Start panning - we'll cancel it on pointermove if an entity drag starts
      panState.isPanning = true;
      panState.panStartPos = { x: event.global.x, y: event.global.y };
      panState.panStartOffset = { ...sceneManager.getScrollOffset() };
    };

    // ========== Pan/Pinch/Entity drag move ==========
    const onPointerMove = (event: FederatedPointerEvent) => {
      const sceneManager = getSceneManager();
      if (!sceneManager) {
        return;
      }

      const entityManager = sceneManager.getEntityManager();
      const pinchState = pinchStateRef.current;
      const panState = panStateRef.current;

      // Handle entity dragging (from useStageInteractions)
      if (interactive && entityManager) {
        const dndState = entityManager.getDndState();
        if (dndState.target && dndState.target.parent && dndState.isDragging) {
          // Cancel pan/pinch when entity is being dragged
          panState.isPanning = false;
          panState.panStartPos = null;
          panState.panStartOffset = null;
          pinchState.isPinching = false;

          // Get the pointer position in the target's parent space
          const pointerPos = dndState.target.parent.toLocal(event.global);

          // Apply the offset so the sprite moves naturally
          dndState.target.position.set(
            pointerPos.x + dndState.offset.x,
            pointerPos.y + dndState.offset.y,
          );
          return;
        }
      }

      if (!sceneManager) {
        return;
      }

      // Handle pinch-to-zoom if 2+ pointers are active
      if (pinchState.pointerPositions.size >= 2) {
        // Update pointer position for pinch tracking
        pinchState.pointerPositions.set(event.pointerId, {
          x: event.global.x,
          y: event.global.y,
        });

        // If we just reached 2 pointers, initialize pinch
        if (pinchState.pointerPositions.size === 2 && !pinchState.isPinching) {
          const pointers = Array.from(pinchState.pointerPositions.values());
          const [p1, p2] = pointers;
          if (!p1 || !p2) {
            return;
          }

          const currentZoom = sceneManager.getZoom();
          const currentScrollOffset = sceneManager.getScrollOffset();

          pinchState.isPinching = true;
          pinchState.startZoom = currentZoom;
          pinchState.startDistance = getDistance(p1, p2);

          const centerScreenX = (p1.x + p2.x) / 2;
          const centerScreenY = (p1.y + p2.y) / 2;

          pinchState.centerWorld = {
            x: (centerScreenX - currentScrollOffset.x) / currentZoom,
            y: (centerScreenY - currentScrollOffset.y) / currentZoom,
          };
          return;
        }

        // Continue pinch if already active
        if (pinchState.isPinching) {
          const pointers = Array.from(pinchState.pointerPositions.values());
          const [p1, p2] = pointers.slice(0, 2);
          if (!p1 || !p2) {
            return;
          }

          const currentDistance = getDistance(p1, p2);

          // Skip if start distance not initialized
          if (pinchState.startDistance === 0 || !pinchState.centerWorld) {
            return;
          }

          // Calculate zoom based on distance change
          const scale = currentDistance / pinchState.startDistance;
          const newZoom = Math.max(
            MIN_ZOOM,
            Math.min(MAX_ZOOM, pinchState.startZoom * scale),
          );

          const centerScreenX = (p1.x + p2.x) / 2;
          const centerScreenY = (p1.y + p2.y) / 2;

          sceneManager.setTransform(newZoom, {
            x: centerScreenX - pinchState.centerWorld.x * newZoom,
            y: centerScreenY - pinchState.centerWorld.y * newZoom,
          });
        }
        return;
      }

      // Handle single pointer panning
      if (!panState.isPanning || !panState.panStartPos) {
        return;
      }

      const deltaX = event.global.x - panState.panStartPos.x;
      const deltaY = event.global.y - panState.panStartPos.y;

      if (panState.panStartOffset) {
        sceneManager.setScrollOffset({
          x: panState.panStartOffset.x + deltaX,
          y: panState.panStartOffset.y + deltaY,
        });
      }
    };

    // ========== Pan/Pinch/Entity drag end ==========
    const onPointerEnd = (event: FederatedPointerEvent) => {
      const sceneManager = getSceneManager();
      const pinchState = pinchStateRef.current;
      const panState = panStateRef.current;

      // Handle entity drag end (from useStageInteractions)
      if (interactive && sceneManager) {
        const entityManager = sceneManager.getEntityManager();
        if (entityManager) {
          const dndState = entityManager.getDndState();
          if (dndState.target && dndState.entityId && dndState.isDragging) {
            // Invoke callback with new position
            const callbacks = getInteractionCallbacks();
            callbacks.onEntityDragEnd?.(
              dndState.entityId,
              dndState.target.x,
              dndState.target.y,
            );

            // Reset drag state
            entityManager.endDrag();
          }
        }
      }

      // Remove pointer from tracking
      pinchState.pointerPositions.delete(event.pointerId);

      // If less than 2 pointers, exit pinch mode
      if (pinchState.pointerPositions.size < 2) {
        pinchState.isPinching = false;
        pinchState.startDistance = 0;
        pinchState.centerWorld = null;
      }

      // Reset pan state if no pointers left
      if (pinchState.pointerPositions.size === 0) {
        panState.isPanning = false;
        panState.panStartPos = null;
        panState.panStartOffset = null;
      }
    };

    // Register event listeners on stage
    stage.on("wheel", onWheel);
    stage.on("pointerdown", onPointerDown);
    stage.on("pointermove", onPointerMove);
    stage.on("pointerup", onPointerEnd);
    stage.on("pointerupoutside", onPointerEnd);
    stage.on("pointercancel", onPointerEnd);

    return () => {
      // Guard: check if still valid before cleanup
      canvas?.removeEventListener("wheel", handleCanvasWheel, {
        capture: true,
      });

      if (stage) {
        stage.off("wheel", onWheel);
        stage.off("pointerdown", onPointerDown);
        stage.off("pointermove", onPointerMove);
        stage.off("pointerup", onPointerEnd);
        stage.off("pointerupoutside", onPointerEnd);
        stage.off("pointercancel", onPointerEnd);
      }
    };
  }, [interactive, getInteractionCallbacks, sceneManagerReady]);
};

"use client";

import { useApplication } from "@pixi/react";
import { FederatedPointerEvent,FederatedWheelEvent } from "pixi.js";
import { useEffect, useRef } from "react";

import { getDndState } from "./useEntityInteractions";
import { useVisualization } from "./VisualizationContext";

/**
 * Hook to handle zoom and pan interactions for the visualization.
 *
 * Features:
 * - Wheel events for zooming (zoom to cursor position)
 * - Middle mouse button or space+drag for panning
 * - Prevents panning when entity dragging is active
 *
 * Must be used within:
 * - A Pixi Application context (for app.stage)
 * - A VisualizationProvider (for zoom/scroll state)
 */
export const useZoomAndPan = () => {
  const { app } = useApplication();
  const { zoom, scrollOffset, setZoom, setScrollOffset, interactive } =
    useVisualization();
  const stageRef = useRef(app.stage);

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

  // Track space key state
  const spaceKeyPressedRef = useRef(false);

  // Update stage ref when app changes
  useEffect(() => {
    stageRef.current = app.stage;
  }, [app]);

  // Set up keyboard listener for space key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        spaceKeyPressedRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        spaceKeyPressedRef.current = false;
        // End pan if space is released
        if (panStateRef.current.isPanning) {
          panStateRef.current = {
            isPanning: false,
            panStartPos: null,
            panStartOffset: null,
          };
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Set up zoom and pan handlers
  useEffect(() => {
    const currentStage = stageRef.current;

    // Set up stage to be interactive for wheel events
    currentStage.eventMode = "static";
    currentStage.hitArea = app.screen;

    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 5.0;
    const ZOOM_SENSITIVITY = 0.001;

    const onWheel = (event: FederatedWheelEvent) => {
      event.preventDefault();

      // Don't zoom if entity is being dragged
      const dndState = getDndState();
      if (dndState.isDragging) {
        return;
      }

      // Calculate zoom delta
      const zoomDelta = -event.deltaY * ZOOM_SENSITIVITY;
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, zoom + zoomDelta)
      );

      if (newZoom === zoom) {
        return; // Zoom clamped, no change
      }

      // Get pointer position in screen coordinates
      const pointerScreenX = event.global.x;
      const pointerScreenY = event.global.y;

      // Convert pointer position to world coordinates before zoom
      const worldX = (pointerScreenX - scrollOffset.x) / zoom;
      const worldY = (pointerScreenY - scrollOffset.y) / zoom;

      // Update zoom
      setZoom(newZoom);

      // Adjust scrollOffset to keep the point under cursor fixed
      // After zoom: worldX = (pointerScreenX - newScrollOffset.x) / newZoom
      // So: newScrollOffset.x = pointerScreenX - worldX * newZoom
      setScrollOffset({
        x: pointerScreenX - worldX * newZoom,
        y: pointerScreenY - worldY * newZoom,
      });
    };

    const onPanStart = (event: FederatedPointerEvent) => {
      // Check if pan should start:
      // - Middle mouse button (button === 1)
      // - OR space key is pressed
      const isMiddleMouse = event.button === 1;
      const isSpacePressed = spaceKeyPressedRef.current;

      if (!isMiddleMouse && !isSpacePressed) {
        return;
      }

      // Don't start pan if entity is being dragged
      const dndState = getDndState();
      if (dndState.isDragging) {
        return;
      }

      event.preventDefault();

      panStateRef.current = {
        isPanning: true,
        panStartPos: { x: event.global.x, y: event.global.y },
        panStartOffset: { ...scrollOffset },
      };
    };

    const onPanMove = (event: FederatedPointerEvent) => {
      if (!panStateRef.current.isPanning || !panStateRef.current.panStartPos) {
        return;
      }

      event.preventDefault();

      // Calculate pan delta
      const deltaX = event.global.x - panStateRef.current.panStartPos.x;
      const deltaY = event.global.y - panStateRef.current.panStartPos.y;

      // Update scroll offset
      if (panStateRef.current.panStartOffset) {
        setScrollOffset({
          x: panStateRef.current.panStartOffset.x + deltaX,
          y: panStateRef.current.panStartOffset.y + deltaY,
        });
      }
    };

    const onPanEnd = () => {
      panStateRef.current = {
        isPanning: false,
        panStartPos: null,
        panStartOffset: null,
      };
    };

    // Register event listeners
    currentStage.on("wheel", onWheel);
    currentStage.on("pointerdown", onPanStart);
    currentStage.on("pointermove", onPanMove);
    currentStage.on("pointerup", onPanEnd);
    currentStage.on("pointerupoutside", onPanEnd);

    return () => {
      const cleanupStage = stageRef.current;
      cleanupStage.off("wheel", onWheel);
      cleanupStage.off("pointerdown", onPanStart);
      cleanupStage.off("pointermove", onPanMove);
      cleanupStage.off("pointerup", onPanEnd);
      cleanupStage.off("pointerupoutside", onPanEnd);
    };
  }, [
    app,
    zoom,
    scrollOffset,
    setZoom,
    setScrollOffset,
    interactive,
  ]);
};

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
 * - Regular drag on empty space for panning
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

  // Refs for zoom and scrollOffset to avoid recreating listeners on every state change
  const zoomRef = useRef(zoom);
  const scrollOffsetRef = useRef(scrollOffset);

  // Update refs when state changes
  useEffect(() => {
    zoomRef.current = zoom;
    scrollOffsetRef.current = scrollOffset;
  }, [zoom, scrollOffset]);

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
    startZoom: zoom,
    centerWorld: null,
  });

  // Update stage ref when app changes
  useEffect(() => {
    stageRef.current = app.stage;
  }, [app]);

  // Set up zoom and pan handlers
  useEffect(() => {
    const currentStage = stageRef.current;

    // Set up stage to be interactive for wheel events
    currentStage.eventMode = "static";
    currentStage.hitArea = app.screen;

    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 5.0;
    const ZOOM_SENSITIVITY = 0.001;

    // Helper function to calculate distance between two points
    const getDistance = (
      p1: { x: number; y: number },
      p2: { x: number; y: number }
    ): number =>
      Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

    const onWheel = (event: FederatedWheelEvent) => {
      event.preventDefault();

      // Don't zoom if entity is being dragged
      const dndState = getDndState();
      if (dndState.isDragging) {
        return;
      }

      // Use refs for current values
      const currentZoom = zoomRef.current;
      const currentScrollOffset = scrollOffsetRef.current;

      // Calculate zoom delta
      const zoomDelta = -event.deltaY * ZOOM_SENSITIVITY;
      const newZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, currentZoom + zoomDelta)
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
      // Don't start pan if entity is already being dragged
      const dndState = getDndState();
      if (dndState.isDragging) {
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
          
          pinchState.isPinching = true;
          pinchState.startZoom = zoomRef.current;
          pinchState.startDistance = getDistance(p1, p2);
          
          // Calculate center point in screen coordinates
          const centerScreenX = (p1.x + p2.x) / 2;
          const centerScreenY = (p1.y + p2.y) / 2;
          
          // Convert to world coordinates
          const currentZoom = zoomRef.current;
          const currentScrollOffset = scrollOffsetRef.current;
          pinchState.centerWorld = {
            x: (centerScreenX - currentScrollOffset.x) / currentZoom,
            y: (centerScreenY - currentScrollOffset.y) / currentZoom,
          };
        }
        return;
      }

      // Single pointer - check if we should start panning
      // Only start panning on left mouse button (button === 0 or undefined)
      // Skip if middle or right mouse button
      if (event.button !== 0 && event.button !== undefined) {
        return;
      }

      // Start panning - we'll cancel it on pointermove if an entity drag starts
      // This allows entity dragging to take priority
      panState.isPanning = true;
      panState.panStartPos = { x: event.global.x, y: event.global.y };
      panState.panStartOffset = { ...scrollOffsetRef.current };
    };

    const onPanMove = (event: FederatedPointerEvent) => {
      // Check if entity drag started - if so, cancel panning and pinching
      const dndState = getDndState();
      if (dndState.isDragging) {
        // Entity is being dragged, cancel pan and pinch
        panStateRef.current = {
          isPanning: false,
          panStartPos: null,
          panStartOffset: null,
        };
        pinchStateRef.current.isPinching = false;
        return;
      }

      const pinchState = pinchStateRef.current;
      const panState = panStateRef.current;

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
          
          pinchState.isPinching = true;
          pinchState.startZoom = zoomRef.current;
          pinchState.startDistance = getDistance(p1, p2);
          
          // Calculate center point in screen coordinates
          const centerScreenX = (p1.x + p2.x) / 2;
          const centerScreenY = (p1.y + p2.y) / 2;
          
          // Convert to world coordinates
          const currentZoom = zoomRef.current;
          const currentScrollOffset = scrollOffsetRef.current;
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
          
          const currentDistance = getDistance(p1, p2);
          
          // Skip if start distance not initialized
          if (pinchState.startDistance === 0 || !pinchState.centerWorld) {
            return;
          }
          
          // Calculate zoom based on distance change
          const scale = currentDistance / pinchState.startDistance;
          const newZoom = Math.max(
            MIN_ZOOM,
            Math.min(MAX_ZOOM, pinchState.startZoom * scale)
          );
          
          // Calculate current center position
          const centerScreenX = (p1.x + p2.x) / 2;
          const centerScreenY = (p1.y + p2.y) / 2;
          
          // Update zoom
          setZoom(newZoom);
          
          // Adjust scrollOffset to keep center point fixed
          setScrollOffset({
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

      // Calculate pan delta
      const deltaX = event.global.x - panState.panStartPos.x;
      const deltaY = event.global.y - panState.panStartPos.y;

      // Update scroll offset
      if (panState.panStartOffset) {
        setScrollOffset({
          x: panState.panStartOffset.x + deltaX,
          y: panState.panStartOffset.y + deltaY,
        });
      }
    };

    const onPanEnd = (event: FederatedPointerEvent) => {
      const pinchState = pinchStateRef.current;
      const panState = panStateRef.current;

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

    // Register event listeners
    currentStage.on("wheel", onWheel);
    currentStage.on("pointerdown", onPanStart);
    currentStage.on("pointermove", onPanMove);
    currentStage.on("pointerup", onPanEnd);
    currentStage.on("pointerupoutside", onPanEnd);
    currentStage.on("pointercancel", onPanEnd);

    return () => {
      const cleanupStage = stageRef.current;
      cleanupStage.off("wheel", onWheel);
      cleanupStage.off("pointerdown", onPanStart);
      cleanupStage.off("pointermove", onPanMove);
      cleanupStage.off("pointerup", onPanEnd);
      cleanupStage.off("pointerupoutside", onPanEnd);
      cleanupStage.off("pointercancel", onPanEnd);
    };
  }, [app, setZoom, setScrollOffset, interactive]);
};

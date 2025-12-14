"use client";

import { createContext, ReactNode, useContext, useRef, useState } from "react";

import type { components } from "@/types/api";

import { SimulationTheme } from "../constants";
import type { EntityManager } from "../pixi/EntityManager";

type CanvasDropEntityType =
  components["schemas"]["BlueprintEntity"]["entityType"];
type CanvasDropParameterInfo = components["schemas"]["ParameterInfo"];

interface ScreenSize {
  width: number;
  height: number;
}

interface ScrollOffset {
  x: number;
  y: number;
}

export interface InteractionCallbacks {
  onEntityDragEnd?: (entityId: string, x: number, y: number) => void;
  onEntityClick?: (entityId: string) => void;
  onCanvasDrop?: (
    entityType: CanvasDropEntityType,
    parameters: Record<string, CanvasDropParameterInfo>,
    x: number,
    y: number,
  ) => void;
}

interface VisualizationContextValue {
  // State
  theme: SimulationTheme;
  screenSize: ScreenSize;
  interactive: boolean;
  zoom: number;
  scrollOffset: ScrollOffset;

  // Actions
  setTheme: (theme: SimulationTheme) => void;
  setScreenSize: (screenSize: ScreenSize) => void;
  setZoom: (zoom: number) => void;
  setScrollOffset: (scrollOffset: ScrollOffset) => void;

  // Interaction callbacks
  registerInteractionCallbacks: (callbacks: InteractionCallbacks) => void;
  getInteractionCallbacks: () => InteractionCallbacks;

  // EntityManager for imperative entity updates (bypassing React)
  registerEntityManager: (manager: EntityManager) => void;
  getEntityManager: () => EntityManager | null;
}

const VisualizationContext = createContext<
  VisualizationContextValue | undefined
>(undefined);

interface VisualizationProviderProps {
  children: ReactNode;
  interactive?: boolean;
}

/**
 * VisualizationProvider - State specific to the PixiJS visualization runtime.
 *
 * This provider contains visualization runtime concerns (theme, screenSize).
 *
 * Entity rendering is handled imperatively by EntityManager (bypasses React).
 * Children can register an EntityManager via registerEntityManager.
 *
 * Children can register interaction callbacks via registerInteractionCallbacks.
 * The visualization layer will invoke these callbacks when interactions occur.
 *
 * @param interactive - Whether entities should be interactive (default: true)
 */
export const VisualizationProvider = ({
  children,
  interactive = true,
}: VisualizationProviderProps) => {
  const [theme, setTheme] = useState<SimulationTheme>("factory");
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: 0,
    height: 0,
  });

  // Zoom and scroll state
  const [zoom, setZoom] = useState<number>(1.0);
  const [scrollOffset, setScrollOffset] = useState<ScrollOffset>({
    x: 0,
    y: 0,
  });

  // Interaction callbacks - stored in ref to avoid re-renders
  const interactionCallbacksRef = useRef<InteractionCallbacks>({});

  const registerInteractionCallbacks = (callbacks: InteractionCallbacks) => {
    interactionCallbacksRef.current = callbacks;
  };

  const getInteractionCallbacks = () => interactionCallbacksRef.current;

  // EntityManager for imperative entity updates (bypasses React re-renders)
  const entityManagerRef = useRef<EntityManager | null>(null);

  const registerEntityManager = (manager: EntityManager) => {
    entityManagerRef.current = manager;
  };

  const getEntityManager = () => entityManagerRef.current;

  const value: VisualizationContextValue = {
    theme,
    screenSize,
    interactive,
    zoom,
    scrollOffset,
    setTheme,
    setScreenSize,
    setZoom,
    setScrollOffset,
    registerInteractionCallbacks,
    getInteractionCallbacks,
    registerEntityManager,
    getEntityManager,
  };

  return (
    <VisualizationContext.Provider value={value}>
      {children}
    </VisualizationContext.Provider>
  );
};

/**
 * Hook to access visualization-specific state.
 * Must be used within a VisualizationProvider (which must be inside a PlaybackProvider).
 */
export const useVisualization = (): VisualizationContextValue => {
  const context = useContext(VisualizationContext);
  if (!context) {
    throw new Error(
      "useVisualization must be used within a VisualizationProvider",
    );
  }
  return context;
};

// Export types for external use
export type { ScreenSize, ScrollOffset, VisualizationContextValue };

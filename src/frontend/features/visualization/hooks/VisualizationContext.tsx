"use client";

import { createContext, ReactNode, useCallback, useContext, useRef, useState } from "react";

import type { components } from "@/types/api";

import { SimulationTheme } from "../constants";
import type { SceneManager } from "../pixi/SceneManager";
import type { ScreenSize } from "../types";

type CanvasDropEntityType = components["schemas"]["BlueprintEntity"]["entityType"];
type CanvasDropParameterInfo = components["schemas"]["ParameterInfo"];

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

  // Actions
  setTheme: (theme: SimulationTheme) => void;
  setScreenSize: (screenSize: ScreenSize) => void;

  // Interaction callbacks
  registerInteractionCallbacks: (callbacks: InteractionCallbacks) => void;
  getInteractionCallbacks: () => InteractionCallbacks;

  // SceneManager for imperative scene updates (bypassing React)
  // SceneManager owns BackgroundManager and EntityManager internally
  registerSceneManager: (manager: SceneManager) => void;
  sceneManagerReady: boolean;
  getSceneManager: () => SceneManager | null;
}

const VisualizationContext = createContext<VisualizationContextValue | undefined>(undefined);

interface VisualizationProviderProps {
  children: ReactNode;
  interactive?: boolean;
}

/**
 * VisualizationProvider - State specific to the PixiJS visualization runtime.
 *
 * This provider contains visualization runtime concerns (theme, screenSize).
 *
 * Scene transform (zoom/pan), background, and entity rendering are all handled
 * imperatively by SceneManager (bypasses React). SceneManager owns BackgroundManager
 * and EntityManager internally.
 *
 * Children can register a SceneManager via registerSceneManager.
 * Children can register interaction callbacks via registerInteractionCallbacks.
 *
 * @param interactive - Whether entities should be interactive (default: true)
 */
export const VisualizationProvider = ({ children, interactive = true }: VisualizationProviderProps) => {
  const [theme, setTheme] = useState<SimulationTheme>("factory");
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: 0,
    height: 0,
  });

  // Interaction callbacks - stored in ref to avoid re-renders
  const interactionCallbacksRef = useRef<InteractionCallbacks>({});

  const registerInteractionCallbacks = useCallback((callbacks: InteractionCallbacks) => {
    interactionCallbacksRef.current = callbacks;
  }, []);

  const getInteractionCallbacks = useCallback(() => interactionCallbacksRef.current, []);

  // SceneManager for imperative scene transform updates (bypasses React re-renders)
  const sceneManagerRef = useRef<SceneManager | null>(null);

  const registerSceneManager = useCallback((manager: SceneManager) => {
    sceneManagerRef.current = manager;
    setSceneManagerReady(true);
  }, []);

  const getSceneManager = useCallback(() => sceneManagerRef.current, []);

  const [sceneManagerReady, setSceneManagerReady] = useState(false);

  const value: VisualizationContextValue = {
    theme,
    screenSize,
    interactive,
    setTheme,
    setScreenSize,
    registerInteractionCallbacks,
    getInteractionCallbacks,
    registerSceneManager,
    getSceneManager,
    sceneManagerReady,
  };

  return <VisualizationContext.Provider value={value}>{children}</VisualizationContext.Provider>;
};

/**
 * Hook to access visualization-specific state.
 * Must be used within a VisualizationProvider (which must be inside a PlaybackProvider).
 */
export const useVisualization = (): VisualizationContextValue => {
  const context = useContext(VisualizationContext);
  if (!context) {
    throw new Error("useVisualization must be used within a VisualizationProvider");
  }
  return context;
};

// Export types for external use
export type { ScreenSize, VisualizationContextValue };

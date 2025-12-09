"use client";

import { createContext, ReactNode, useContext, useRef, useState } from "react";

import { SimulationTheme } from "../constants";
import type { SimulationEntityState } from "../types";

interface ScreenSize {
  width: number;
  height: number;
}

export interface InteractionCallbacks {
  onEntityDragEnd?: (entityId: string, x: number, y: number) => void;
  onEntityClick?: (entityId: string) => void;
  onCanvasDrop?: (
    entityType: string,
    parameters: Record<string, "string" | "number">,
    x: number,
    y: number
  ) => void;
}

interface VisualizationContextValue {
  // State
  theme: SimulationTheme;
  screenSize: ScreenSize;
  entities: SimulationEntityState[];
  interactive: boolean;

  // Actions
  setTheme: (theme: SimulationTheme) => void;
  setScreenSize: (screenSize: ScreenSize) => void;
  setEntities: (entities: SimulationEntityState[]) => void;

  // Interaction callbacks
  registerInteractionCallbacks: (callbacks: InteractionCallbacks) => void;
  getInteractionCallbacks: () => InteractionCallbacks;
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
 * This provider contains visualization runtime concerns (theme, screenSize, entities).
 *
 * Children components (SimulationEntityUpdater, BuilderInteractionHandler) are responsible
 * for updating entities via setEntities.
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

  // Entity state - updated by children (SimulationEntityUpdater or BuilderInteractionHandler)
  const [entities, setEntities] = useState<SimulationEntityState[]>([]);

  // Interaction callbacks - stored in ref to avoid re-renders
  const interactionCallbacksRef = useRef<InteractionCallbacks>({});

  const registerInteractionCallbacks = (callbacks: InteractionCallbacks) => {
    interactionCallbacksRef.current = callbacks;
  };

  const getInteractionCallbacks = () => interactionCallbacksRef.current;

  const value: VisualizationContextValue = {
    theme,
    screenSize,
    entities,
    interactive,
    setTheme,
    setScreenSize,
    setEntities,
    registerInteractionCallbacks,
    getInteractionCallbacks,
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
      "useVisualization must be used within a VisualizationProvider"
    );
  }
  return context;
};

// Export types for external use
export type { ScreenSize, VisualizationContextValue };

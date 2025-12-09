"use client";

import { Container } from "pixi.js";
import { createContext, ReactNode, RefObject, useContext, useState } from "react";

import { SimulationTheme } from "../constants";
import type { SimulationEntityState } from "../types";

interface ScreenSize {
    width: number;
    height: number;
}

export interface VisualizationHooks {
    useScene?: () => void;
    useEntity?: (containerRef: RefObject<Container | null>, entityId: string | undefined) => void;
}

interface VisualizationContextValue {
    // State
    theme: SimulationTheme;
    screenSize: ScreenSize;
    entities: SimulationEntityState[];
    
    // Actions
    setTheme: (theme: SimulationTheme) => void;
    setScreenSize: (screenSize: ScreenSize) => void;
    setEntities: (entities: SimulationEntityState[]) => void;
    
    // Hooks
    hooks: VisualizationHooks;
}

const VisualizationContext = createContext<VisualizationContextValue | undefined>(undefined);

interface VisualizationProviderProps {
    children: ReactNode;
    entities?: SimulationEntityState[];
    hooks?: VisualizationHooks;
}

/**
 * VisualizationProvider - State specific to the PixiJS visualization runtime.
 * 
 * This provider contains visualization runtime concerns (theme, screenSize, entities).
 * Entities and hooks can be provided by parent components (BuilderViewport or SimulationViewport).
 * 
 * Supports Controlled vs Uncontrolled pattern for entities:
 * - Controlled (Builder Mode): 'entities' prop is provided, so it takes precedence.
 * - Uncontrolled (Simulation Mode): 'entities' prop is undefined, so internal state is used.
 * 
 * Must be used within a PlaybackProvider.
 */
export const VisualizationProvider = ({ 
  children, 
  entities: externalEntities,
  hooks = {}
}: VisualizationProviderProps) => {
  const [theme, setTheme] = useState<SimulationTheme>("factory");
  const [screenSize, setScreenSize] = useState<ScreenSize>({ width: 0, height: 0 });
  
  // Internal state for simulation mode (uncontrolled)
  const [internalEntities, setInternalEntities] = useState<SimulationEntityState[]>([]);

  // Derived state: Use external entities if provided (builder), otherwise internal (simulation)
  const entities = externalEntities ?? internalEntities;

  const value: VisualizationContextValue = {
    theme,
    screenSize,
    entities,
    setTheme,
    setScreenSize,
    setEntities: setInternalEntities, // Always update internal state, but it only affects output in simulation mode
    hooks,
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
    throw new Error("useVisualization must be used within a VisualizationProvider");
  }
  return context;
};

// Export types for external use
export type { ScreenSize, VisualizationContextValue };

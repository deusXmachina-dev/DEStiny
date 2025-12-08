"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { SimulationTheme } from "../constants";
import { SimulationBlueprint } from "../types";

interface ScreenSize {
    width: number;
    height: number;
}

export type AppMode = "simulation" | "builder";

interface SimulationContextValue {
    // State
    theme: SimulationTheme;
    screenSize: ScreenSize;
    mode: AppMode;
    blueprint: SimulationBlueprint | null;
    
    // Actions
    setTheme: (theme: SimulationTheme) => void;
    setScreenSize: (screenSize: ScreenSize) => void;
    setMode: (mode: AppMode) => void;
    setBlueprint: (blueprint: SimulationBlueprint | null) => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

interface SimulationProviderProps {
    children: ReactNode;
}

/**
 * SimulationProvider - State specific to the PixiJS movement simulation.
 * 
 * This provider contains only simulation concerns (theme, mode, blueprint).
 * 
 * Must be used within a PlaybackProvider.
 */
export const SimulationProvider = ({ children }: SimulationProviderProps) => {
  const [theme, setTheme] = useState<SimulationTheme>("factory");
  const [screenSize, setScreenSize] = useState<ScreenSize>({ width: 0, height: 0 });
  const [mode, setMode] = useState<AppMode>("simulation");
  const [blueprint, setBlueprint] = useState<SimulationBlueprint | null>(null);

  const value: SimulationContextValue = {
    theme,
    screenSize,
    mode,
    blueprint,
    setTheme,
    setScreenSize,
    setMode,
    setBlueprint,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
};

/**
 * Hook to access simulation-specific state.
 * Must be used within a SimulationProvider (which must be inside a PlaybackProvider).
 */
export const useSimulation = (): SimulationContextValue => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
};

// Export types for external use
export type { ScreenSize,SimulationContextValue };

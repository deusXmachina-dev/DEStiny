"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { SimulationTheme } from "../../visualization/constants";

interface ScreenSize {
    width: number;
    height: number;
}

interface SimulationContextValue {
    // State
    theme: SimulationTheme;
    screenSize: ScreenSize;
    
    // Actions
    setTheme: (theme: SimulationTheme) => void;
    setScreenSize: (screenSize: ScreenSize) => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

interface SimulationProviderProps {
    children: ReactNode;
}

/**
 * SimulationProvider - State specific to the PixiJS movement simulation runtime.
 * 
 * This provider contains only simulation runtime concerns (theme, screenSize).
 * Blueprint data should be consumed from BuilderContext or passed as props.
 * 
 * Must be used within a PlaybackProvider.
 */
export const SimulationProvider = ({ children }: SimulationProviderProps) => {
  const [theme, setTheme] = useState<SimulationTheme>("factory");
  const [screenSize, setScreenSize] = useState<ScreenSize>({ width: 0, height: 0 });

  const value: SimulationContextValue = {
    theme,
    screenSize,
    setTheme,
    setScreenSize,
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
export type { ScreenSize, SimulationContextValue };

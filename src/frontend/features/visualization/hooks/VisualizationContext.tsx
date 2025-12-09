"use client";

import { createContext, ReactNode, useContext, useState } from "react";

import { SimulationTheme } from "../constants";

interface ScreenSize {
    width: number;
    height: number;
}

interface VisualizationContextValue {
    // State
    theme: SimulationTheme;
    screenSize: ScreenSize;
    
    // Actions
    setTheme: (theme: SimulationTheme) => void;
    setScreenSize: (screenSize: ScreenSize) => void;
}

const VisualizationContext = createContext<VisualizationContextValue | undefined>(undefined);

interface VisualizationProviderProps {
    children: ReactNode;
}

/**
 * VisualizationProvider - State specific to the PixiJS visualization runtime.
 * 
 * This provider contains only visualization runtime concerns (theme, screenSize).
 * Blueprint data should be consumed from BuilderContext or passed as props.
 * 
 * Must be used within a PlaybackProvider.
 */
export const VisualizationProvider = ({ children }: VisualizationProviderProps) => {
  const [theme, setTheme] = useState<SimulationTheme>("factory");
  const [screenSize, setScreenSize] = useState<ScreenSize>({ width: 0, height: 0 });

  const value: VisualizationContextValue = {
    theme,
    screenSize,
    setTheme,
    setScreenSize,
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

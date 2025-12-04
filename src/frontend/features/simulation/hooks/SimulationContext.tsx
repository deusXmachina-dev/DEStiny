"use client";

import { usePlayback } from "@features/playback";
import { createContext, ReactNode,useContext, useMemo, useState } from "react";

import { SimulationTheme } from "../constants";
import { SimulationEngine } from "../logic/SimulationEngine";
import { BoundingBox } from "../types";

interface SimulationContextValue {
    // State
    theme: SimulationTheme;
    boundingBox: BoundingBox | null;
    
    // Actions
    setTheme: (theme: SimulationTheme) => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

interface SimulationProviderProps {
    children: ReactNode;
}

/**
 * SimulationProvider - State specific to the PixiJS movement simulation.
 * 
 * This provider contains only simulation concerns (theme, boundingBox).
 * It consumes PlaybackProvider for recording data to compute the bounding box.
 * 
 * Must be used within a PlaybackProvider.
 */
export const SimulationProvider = ({ children }: SimulationProviderProps) => {
    const { recording } = usePlayback();
    const [theme, setTheme] = useState<SimulationTheme>("factory");

    // Compute bounding box from recording (memoized, computed once when recording changes)
    const boundingBox = useMemo<BoundingBox | null>(() => {
        if (!recording) return null;
        const engine = new SimulationEngine(recording);
        return engine.getBoundingBox();
    }, [recording]);

    const value: SimulationContextValue = {
        theme,
        boundingBox,
        setTheme,
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
export type { SimulationContextValue };


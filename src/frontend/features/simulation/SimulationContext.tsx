"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { SimulationSnapshot } from "./types";
import dummyHistory from "./dummySimulationHistory.json";

interface SimulationContextValue {
    // State
    history: SimulationSnapshot[];
    simulationName: string;
    isPlaying: boolean;
    speed: number;
    
    // Actions
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    setSpeed: (speed: number) => void;
    setHistory: (history: SimulationSnapshot[]) => void;
    setSimulationName: (name: string) => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

interface SimulationProviderProps {
    children: ReactNode;
}

export const SimulationProvider = ({ children }: SimulationProviderProps) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [simulationName, setSimulationName] = useState("Simulation 1");
    const [history, setHistory] = useState<SimulationSnapshot[]>(dummyHistory as SimulationSnapshot[]);

    // Actions
    const play = useCallback(() => setIsPlaying(true), []);
    const pause = useCallback(() => setIsPlaying(false), []);
    const togglePlay = useCallback(() => setIsPlaying(prev => !prev), []);

    const value: SimulationContextValue = {
        history,
        simulationName,
        isPlaying,
        speed,
        play,
        pause,
        togglePlay,
        setSpeed,
        setHistory,
        setSimulationName,
    };

    return (
        <SimulationContext.Provider value={value}>
            {children}
        </SimulationContext.Provider>
    );
};

export const useSimulationController = (): SimulationContextValue => {
    const context = useContext(SimulationContext);
    if (!context) {
        throw new Error("useSimulationController must be used within a SimulationProvider");
    }
    return context;
};


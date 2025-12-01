"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { SimulationSnapshot } from "./types";

interface SimulationContextValue {
    // State
    history: SimulationSnapshot[];
    simulationName: string;
    isPlaying: boolean;
    speed: number;
    currentTime: number;
    duration: number;
    
    // Actions
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    setSpeed: (speed: number) => void;
    setHistory: (history: SimulationSnapshot[]) => void;
    setSimulationName: (name: string) => void;
    seek: (time: number) => void;
    setCurrentTime: (time: number) => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

interface SimulationProviderProps {
    children: ReactNode;
}

export const SimulationProvider = ({ children }: SimulationProviderProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [simulationName, setSimulationName] = useState("Upload Simulation");
    const [history, setHistory] = useState<SimulationSnapshot[]>([]);
    const [currentTime, setCurrentTime] = useState(0);

    // Compute duration from history
    const duration = history.length > 0 ? history[history.length - 1].time : 0;

    // Actions
    const play = useCallback(() => setIsPlaying(true), []);
    const pause = useCallback(() => setIsPlaying(false), []);
    const togglePlay = useCallback(() => setIsPlaying(prev => !prev), []);
    const seek = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    const value: SimulationContextValue = {
        history,
        simulationName,
        isPlaying,
        speed,
        currentTime,
        duration,
        play,
        pause,
        togglePlay,
        setSpeed,
        setHistory,
        setSimulationName,
        seek,
        setCurrentTime,
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


import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { SimulationRecording } from "../types";
import { SimulationBackgroundTheme } from "../constants";

interface SimulationContextValue {
    // State
    recording: SimulationRecording | null;
    simulationName: string;
    isPlaying: boolean;
    speed: number;
    currentTime: number;
    duration: number;
    seekTarget: number | null;
    theme: SimulationBackgroundTheme;
    
    // Actions
    play: () => void;
    pause: () => void;
    togglePlay: () => void;
    setSpeed: (speed: number) => void;
    setRecording: (recording: SimulationRecording | null) => void;
    setSimulationName: (name: string) => void;
    seek: (time: number) => void;
    setCurrentTime: (time: number) => void;
    clearSeekTarget: () => void;
    setTheme: (theme: SimulationBackgroundTheme) => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

interface SimulationProviderProps {
    children: ReactNode;
}

export const SimulationProvider = ({ children }: SimulationProviderProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [simulationName, setSimulationName] = useState("Upload Simulation");
    const [recording, setRecording] = useState<SimulationRecording | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [seekTarget, setSeekTarget] = useState<number | null>(null);
    const [theme, setTheme] = useState<SimulationBackgroundTheme>("factory");

    // Compute duration from recording
    const duration = recording?.duration || 0;

    // Actions
    const play = useCallback(() => setIsPlaying(true), []);
    const pause = useCallback(() => setIsPlaying(false), []);
    const togglePlay = useCallback(() => setIsPlaying(prev => !prev), []);
    const seek = useCallback((time: number) => {
        setSeekTarget(time);
        setCurrentTime(time);
    }, []);

    const clearSeekTarget = useCallback(() => {
        setSeekTarget(null);
    }, []);

    const value: SimulationContextValue = {
        recording,
        simulationName,
        isPlaying,
        speed,
        currentTime,
        duration,
        seekTarget,
        theme,
        play,
        pause,
        togglePlay,
        setSpeed,
        setRecording,
        setSimulationName,
        seek,
        setCurrentTime,
        clearSeekTarget,
        setTheme,
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


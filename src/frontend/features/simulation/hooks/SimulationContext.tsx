import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { SimulationRecording, BoundingBox } from "../types";
import { SimulationBackgroundTheme } from "../constants";
import { SimulationEngine } from "../logic/SimulationEngine";

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
    boundingBox: BoundingBox | null;
    
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

/**
 * Get initial recording from dummy data if in development mode.
 * Uses dynamic import to avoid bundling dummy data in production.
 * Controlled by NEXT_PUBLIC_DEV_RECORDING env variable.
 * */
function getInitialRecording(): {
    recording: SimulationRecording | null;
    name: string;
} {
    if (process.env.NODE_ENV !== "development") {
        return { recording: null, name: "Upload Simulation" };
    }

    const devRecording = process.env.NEXT_PUBLIC_DEV_RECORDING;
    if (!devRecording) {
        return { recording: null, name: "Upload Simulation" };
    }

    // Only import dummy data in development to keep it out of production bundle
    try {
        // Dynamic require for development-only data
        const recordingData = require(`@/${devRecording}`);
        return { recording: recordingData as SimulationRecording, name: "Dummy Recording" };
    } catch (error) {
        // Fallback if dummy data is not available
        console.warn(`Failed to load dev recording: ${devRecording}`, error);
        return { recording: null, name: "Upload Simulation" };
    }
}

export const SimulationProvider = ({ children }: SimulationProviderProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    
    // Initialize recording and name synchronously before first render using lazy initializers
    // Lazy initializers ensure getInitialRecording() only runs once on mount
    const [simulationName, setSimulationName] = useState(() => getInitialRecording().name);
    const [recording, setRecording] = useState<SimulationRecording | null>(() => getInitialRecording().recording);
    const [currentTime, setCurrentTime] = useState(0);
    const [seekTarget, setSeekTarget] = useState<number | null>(null);
    const [theme, setTheme] = useState<SimulationBackgroundTheme>("factory");

    // Compute duration from recording
    const duration = recording?.duration || 0;

    // Compute bounding box from recording (memoized, computed once when recording changes)
    const boundingBox = useMemo<BoundingBox | null>(() => {
        if (!recording) return null;
        const engine = new SimulationEngine(recording);
        return engine.getBoundingBox();
    }, [recording]);

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
        boundingBox,
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


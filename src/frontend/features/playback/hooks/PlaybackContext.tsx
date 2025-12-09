"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

import { setDefaultWithDevOverride } from "@/lib/utils";

import { PlaybackClock } from "../components/PlaybackClock";
import { SimulationRecording } from "../types";

interface PlaybackContextValue {
  // State
  recording: SimulationRecording | null;
  hasRecording: boolean;
  simulationName: string;
  isPlaying: boolean;
  speed: number;
  currentTime: number;
  duration: number;
  seekTarget: number | null;

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
}

const PlaybackContext = createContext<PlaybackContextValue | undefined>(
  undefined
);

/**
 * Get initial recording from dummy data if in development mode.
 * Uses dynamic require to avoid bundling dummy data in production.
 * Controlled by NEXT_PUBLIC_DEV_RECORDING env variable.
 */
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
    // Dynamic import for development-only data

    const recordingData = require(`@/${devRecording}`);
    return {
      recording: recordingData as SimulationRecording,
      name: "Dummy Recording",
    };
  } catch (error) {
    // Fallback if dummy data is not available
    console.warn(`Failed to load dev recording: ${devRecording}`, error);
    return { recording: null, name: "Upload Simulation" };
  }
}

/**
 * PlaybackProvider - Core simulation playback state and controls.
 *
 * This provider contains only playback-related state (recording, play/pause, speed, time)
 * with NO visualization dependencies. It can be consumed by any view (visualization, metrics, etc.).
 */
export const PlaybackProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(setDefaultWithDevOverride(1, 20));
  const [simulationName, setSimulationName] = useState(
    () => getInitialRecording().name
  );
  const [recording, setRecording] = useState<SimulationRecording | null>(
    () => getInitialRecording().recording
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  // Compute duration from recording
  const duration = recording?.duration || 0;
  const hasRecording = recording !== null;

  // Actions
  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);
  const seek = useCallback((time: number) => {
    setSeekTarget(time);
    setCurrentTime(time);
  }, []);

  const clearSeekTarget = useCallback(() => {
    setSeekTarget(null);
  }, []);

  const value: PlaybackContextValue = {
    recording,
    hasRecording,
    simulationName,
    isPlaying,
    speed,
    currentTime,
    duration,
    seekTarget,
    play,
    pause,
    togglePlay,
    setSpeed,
    setRecording,
    setSimulationName,
    seek,
    setCurrentTime,
    clearSeekTarget,
  };

  return (
    <PlaybackContext.Provider value={value}>
      <PlaybackClock />
      {children}
    </PlaybackContext.Provider>
  );
};

/**
 * Hook to access playback state and controls.
 * Can be used by any component that needs playback functionality.
 */
export const usePlayback = (): PlaybackContextValue => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error("usePlayback must be used within a PlaybackProvider");
  }
  return context;
};

// Export types for external use
export type { PlaybackContextValue };

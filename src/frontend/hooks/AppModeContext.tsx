"use client";

import { usePlayback } from "@features/playback";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

export type AppMode = "simulation" | "builder";

interface AppModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  switchToSimulation: () => void;
  switchToBuilder: () => void;
}

const AppModeContext = createContext<AppModeContextValue | undefined>(
  undefined,
);

interface AppModeProviderProps {
  children: ReactNode;
}

/**
 * AppModeProvider - global app mode (builder vs simulation).
 *
 * Centralizes mode state and side-effects (like pausing/resetting playback
 * when switching back to the builder) so individual components don't need
 * to coordinate this logic via prop drilling.
 */
export function AppModeProvider({ children }: AppModeProviderProps) {
  const { pause, seek } = usePlayback();
  const [mode, setModeState] = useState<AppMode>("builder");

  const setMode = useCallback(
    (nextMode: AppMode) => {
      setModeState(nextMode);

      if (nextMode === "builder") {
        // When returning to the builder, pause playback and reset time
        pause();
        seek(0);
      }
    },
    [pause, seek],
  );

  const switchToSimulation = useCallback(
    () => setMode("simulation"),
    [setMode],
  );

  const switchToBuilder = useCallback(
    () => setMode("builder"),
    [setMode],
  );

  const value: AppModeContextValue = {
    mode,
    setMode,
    switchToSimulation,
    switchToBuilder,
  };

  return (
    <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
  );
}

export function useAppMode(): AppModeContextValue {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error("useAppMode must be used within an AppModeProvider");
  }
  return context;
}

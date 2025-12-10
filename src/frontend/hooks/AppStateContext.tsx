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

interface AppStateContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  switchToSimulation: () => void;
  switchToBuilder: () => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined,
);

interface AppStateProviderProps {
  children: ReactNode;
}

/**
 * AppStateProvider - top-level application state context.
 *
 * Manages global app state including mode (builder vs simulation) and
 * side-effects (like pausing/resetting playback when switching back to
 * the builder). This context can be extended to include other top-level
 * state like user information, theme preferences, etc.
 */
export function AppStateProvider({ children }: AppStateProviderProps) {
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

  const value: AppStateContextValue = {
    mode,
    setMode,
    switchToSimulation,
    switchToBuilder,
  };

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}

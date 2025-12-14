"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";

export type AppMode = "simulation" | "builder";

interface AppStateContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
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
  const [mode, setMode] = useState<AppMode>("builder");

  const value: AppStateContextValue = {
    mode,
    setMode,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}

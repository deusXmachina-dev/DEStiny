"use client";

import { createContext, ReactNode, useContext, useState } from "react";

export type AppMode = "simulation" | "builder";

interface AppStateContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(
  undefined
);

interface AppStateProviderProps {
  children: ReactNode;
}

/**
 * AppStateProvider - Manages high-level application state (mode, UI state, etc.).
 *
 * This provider should be placed at the root level to allow layout components
 * to conditionally render based on the current application state.
 */
export const AppStateProvider = ({ children }: AppStateProviderProps) => {
  const [mode, setMode] = useState<AppMode>("simulation");

  const value: AppStateContextValue = {
    mode,
    setMode,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

/**
 * Hook to access application state.
 * Must be used within an AppStateProvider.
 */
export const useAppState = (): AppStateContextValue => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
};

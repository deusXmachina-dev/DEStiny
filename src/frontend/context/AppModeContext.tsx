"use client";

import { createContext, ReactNode, useContext, useState } from "react";

export type AppMode = "simulation" | "builder";

interface AppModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const AppModeContext = createContext<AppModeContextValue | undefined>(undefined);

interface AppModeProviderProps {
  children: ReactNode;
}

/**
 * AppModeProvider - Manages high-level application mode (builder vs simulation).
 * 
 * This provider should be placed at the root level to allow layout components
 * to conditionally render based on the current mode.
 */
export const AppModeProvider = ({ children }: AppModeProviderProps) => {
  const [mode, setMode] = useState<AppMode>("simulation");

  const value: AppModeContextValue = {
    mode,
    setMode,
  };

  return (
    <AppModeContext.Provider value={value}>
      {children}
    </AppModeContext.Provider>
  );
};

/**
 * Hook to access application mode state.
 * Must be used within an AppModeProvider.
 */
export const useAppMode = (): AppModeContextValue => {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error("useAppMode must be used within an AppModeProvider");
  }
  return context;
};

"use client";

import { Container } from "pixi.js";
import { createContext, ReactNode, useContext, useMemo, useRef } from "react";

interface DndState {
  target: Container | null;
  offset: { x: number; y: number };
  entityId: string | null;
}

interface DndContextValue {
  startDrag: (
    target: Container,
    entityId: string,
    offset: { x: number; y: number }
  ) => void;
  endDrag: () => void;
  getDndState: () => DndState;
}

const DndContext = createContext<DndContextValue | undefined>(undefined);

interface DndProviderProps {
  children: ReactNode;
}

/**
 * DndProvider - Manages drag state for entity drag and drop.
 *
 * Uses refs to store drag state (no re-renders needed since drag
 * operations are handled imperatively via PixiJS event handlers).
 *
 * This is a pure "drag and drop" mechanism - it only tracks visual drag state.
 * Blueprint mutations are handled by BuilderContext, not here.
 *
 * Must be used within a Pixi Application context.
 */
export const DndProvider = ({ children }: DndProviderProps) => {
  const dndStateRef = useRef<DndState>({
    target: null,
    offset: { x: 0, y: 0 },
    entityId: null,
  });

  const startDrag = (
    target: Container,
    entityId: string,
    offset: { x: number; y: number }
  ) => {
    dndStateRef.current = {
      target,
      offset,
      entityId,
    };
    target.alpha = 0.5;
  };

  const endDrag = () => {
    if (dndStateRef.current.target) {
      dndStateRef.current.target.alpha = 1;
    }
    dndStateRef.current = {
      target: null,
      offset: { x: 0, y: 0 },
      entityId: null,
    };
  };

  const getDndState = () => dndStateRef.current;

  // Memoize the context value to prevent unnecessary re-renders of consumers.
  // The functions are stable (they only reference the ref), so the value never needs to change.
  const value: DndContextValue = useMemo(
    () => ({
      startDrag,
      endDrag,
      getDndState,
    }),
    [] // Empty deps: functions are stable and only reference the ref
  );

  return <DndContext.Provider value={value}>{children}</DndContext.Provider>;
};

/**
 * Hook to access dnd context.
 * Must be used within a DndProvider.
 */
export const useDnd = (): DndContextValue => {
  const context = useContext(DndContext);
  if (!context) {
    throw new Error("useDnd must be used within a DndProvider");
  }
  return context;
};

"use client";

import { Container } from "pixi.js";
import { createContext, ReactNode, useContext, useRef } from "react";

import type { SimulationBlueprint } from "../../types";

interface DndState {
  target: Container | null;
  offset: { x: number; y: number };
  entityId: string | null;
  blueprint: SimulationBlueprint | null;
  setBlueprint: ((blueprint: SimulationBlueprint) => void) | null;
}

interface DndContextValue {
  startDrag: (
    target: Container,
    entityId: string,
    blueprint: SimulationBlueprint,
    setBlueprint: (blueprint: SimulationBlueprint) => void,
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
 * Must be used within a Pixi Application context.
 */
export const DndProvider = ({ children }: DndProviderProps) => {
  const dndStateRef = useRef<DndState>({
    target: null,
    offset: { x: 0, y: 0 },
    entityId: null,
    blueprint: null,
    setBlueprint: null,
  });

  const startDrag = (
    target: Container,
    entityId: string,
    blueprint: SimulationBlueprint,
    setBlueprint: (blueprint: SimulationBlueprint) => void,
    offset: { x: number; y: number }
  ) => {
    dndStateRef.current = {
      target,
      offset,
      entityId,
      blueprint,
      setBlueprint,
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
      blueprint: null,
      setBlueprint: null,
    };
  };

  const getDndState = () => dndStateRef.current;

  const value: DndContextValue = {
    startDrag,
    endDrag,
    getDndState,
  };

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

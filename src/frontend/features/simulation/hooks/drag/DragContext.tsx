"use client";

import { Container } from "pixi.js";
import { createContext, ReactNode, useContext, useRef } from "react";

import type { SimulationBlueprint } from "../../types";

interface DragState {
  target: Container | null;
  offset: { x: number; y: number };
  entityId: string | null;
  blueprint: SimulationBlueprint | null;
  setBlueprint: ((blueprint: SimulationBlueprint) => void) | null;
}

interface DragContextValue {
  startDrag: (
    target: Container,
    entityId: string,
    blueprint: SimulationBlueprint,
    setBlueprint: (blueprint: SimulationBlueprint) => void,
    offset: { x: number; y: number }
  ) => void;
  endDrag: () => void;
  getDragState: () => DragState;
}

const DragContext = createContext<DragContextValue | undefined>(undefined);

interface DragProviderProps {
  children: ReactNode;
}

/**
 * DragProvider - Manages drag state for entity drag and drop.
 * 
 * Uses refs to store drag state (no re-renders needed since drag
 * operations are handled imperatively via PixiJS event handlers).
 * 
 * Must be used within a Pixi Application context.
 */
export const DragProvider = ({ children }: DragProviderProps) => {
  const dragStateRef = useRef<DragState>({
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
    dragStateRef.current = {
      target,
      offset,
      entityId,
      blueprint,
      setBlueprint,
    };
    target.alpha = 0.5;
  };

  const endDrag = () => {
    if (dragStateRef.current.target) {
      dragStateRef.current.target.alpha = 1;
    }
    dragStateRef.current = {
      target: null,
      offset: { x: 0, y: 0 },
      entityId: null,
      blueprint: null,
      setBlueprint: null,
    };
  };

  const getDragState = () => dragStateRef.current;

  const value: DragContextValue = {
    startDrag,
    endDrag,
    getDragState,
  };

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
};

/**
 * Hook to access drag context.
 * Must be used within a DragProvider.
 */
export const useDrag = (): DragContextValue => {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error("useDrag must be used within a DragProvider");
  }
  return context;
};

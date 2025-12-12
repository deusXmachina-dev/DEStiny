"use client";

import { createContext, ReactNode, useContext, useRef, useState } from "react";

import type {
  BlueprintEntity,
  BlueprintEntityParameter,
  ParameterInfo,
  SimulationBlueprint,
} from "../types";
import {
  createBlueprintEntity,
  getNextEntityName,
  removeBlueprintEntity,
  updateBlueprintEntityName,
  updateBlueprintEntityParameters,
  updateBlueprintEntityPosition,
} from "../utils";

interface BuilderContextValue {
  // State
  blueprint: SimulationBlueprint | null;
  selectedEntityId: string | null;
  isEditorOpen: boolean;

  // Blueprint actions
  addEntity: (
    entityType: BlueprintEntity["entityType"],
    parameters: Record<string, ParameterInfo>,
    x: number,
    y: number,
  ) => void;
  removeEntity: (entityId: string) => void;
  updateEntity: (
    entityId: string,
    formValues: Record<string, BlueprintEntityParameter>,
  ) => void;
  moveEntity: (entityId: string, x: number, y: number) => void;
  updateEntityName: (entityId: string, name: string) => void;

  // Selection actions
  selectEntity: (entityId: string) => void;
  clearSelection: () => void;

  // Editor actions
  openEditor: (entityId: string) => void;
  closeEditor: () => void;
  isJustClosed: () => boolean;
}

export const BuilderContext = createContext<BuilderContextValue | undefined>(
  undefined,
);

interface BuilderProviderProps {
  children: ReactNode;
}

/**
 * BuilderProvider - Manages the "editing session" state for the builder.
 *
 * This provider holds:
 * - The blueprint (source of truth for entities)
 * - Selected entity state
 * - Editor open/close state
 *
 * All blueprint mutations go through this context to ensure consistency.
 */
export const BuilderProvider = ({ children }: BuilderProviderProps) => {
  const [blueprint, setBlueprint] = useState<SimulationBlueprint | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const justClosedRef = useRef(false);

  const addEntity = (
    entityType: BlueprintEntity["entityType"],
    parameters: Record<string, ParameterInfo>,
    x: number,
    y: number,
  ) => {
    const currentBlueprint = blueprint || {
      simParams: {
        initialTime: 0,
      },
      entities: [],
    };
    const name = getNextEntityName(entityType, currentBlueprint);
    const newEntity = createBlueprintEntity(name, entityType, parameters, x, y);
    setBlueprint({
      ...currentBlueprint,
      entities: [...currentBlueprint.entities, newEntity],
    });
  };

  const removeEntity = (entityId: string) => {
    if (!blueprint) {
      return;
    }
    setBlueprint(removeBlueprintEntity(blueprint, entityId));
    if (selectedEntityId === entityId) {
      setSelectedEntityId(null);
      setIsEditorOpen(false);
    }
  };

  const updateEntity = (
    entityId: string,
    formValues: Record<string, BlueprintEntityParameter>,
  ) => {
    if (!blueprint) {
      return;
    }
    // Extract name from formValues if present
    const nameParam = formValues.name;
    const name =
      nameParam?.parameterType === "primitive"
        ? String(nameParam.value ?? "")
        : undefined;

    // Remove name from formValues before updating parameters
    const { name: _, ...parameters } = formValues;

    let updatedBlueprint = updateBlueprintEntityParameters(
      blueprint,
      entityId,
      parameters,
    );
    if (name !== undefined) {
      updatedBlueprint = updateBlueprintEntityName(
        updatedBlueprint,
        entityId,
        name,
      );
    }
    setBlueprint(updatedBlueprint);
  };

  const moveEntity = (entityId: string, x: number, y: number) => {
    if (!blueprint) {
      return;
    }
    setBlueprint(updateBlueprintEntityPosition(blueprint, entityId, x, y));
  };

  const updateEntityName = (entityId: string, name: string) => {
    if (!blueprint) {
      return;
    }
    setBlueprint(updateBlueprintEntityName(blueprint, entityId, name));
  };

  const selectEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
  };

  const clearSelection = () => {
    setSelectedEntityId(null);
  };

  const openEditor = (entityId: string) => {
    // Prevent opening if we just closed the dialog (to avoid reopening from overlay click)
    if (justClosedRef.current) {
      return;
    }
    setSelectedEntityId(entityId);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setSelectedEntityId(null);
    // Set flag to prevent immediate reopening from the same click
    justClosedRef.current = true;
    // Clear flag after a short delay
    setTimeout(() => {
      justClosedRef.current = false;
    }, 150);
  };

  const isJustClosed = () => justClosedRef.current;

  const value: BuilderContextValue = {
    blueprint,
    selectedEntityId,
    isEditorOpen,
    addEntity,
    removeEntity,
    updateEntity,
    moveEntity,
    updateEntityName,
    selectEntity,
    clearSelection,
    openEditor,
    closeEditor,
    isJustClosed,
  };

  return (
    <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>
  );
};

/**
 * Hook to access builder context.
 * Must be used within a BuilderProvider.
 */
export const useBuilder = (): BuilderContextValue => {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
};

"use client";

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";

import { $api } from "@/lib/api-client";

import type { BlueprintEntity, BlueprintEntityParameter, ParameterInfo, SimulationBlueprint } from "../types";
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
  updateEntity: (entityId: string, formValues: Record<string, BlueprintEntityParameter>) => void;
  updateSimParams: (params: Partial<SimulationBlueprint["simParams"]>) => void;
  moveEntity: (entityId: string, x: number, y: number) => void;
  updateEntityName: (entityId: string, name: string) => void;
  setBlueprint: (blueprint: SimulationBlueprint) => void;
  fetchBlueprint: () => void;
  clearEntities: () => void;
  hasEntities: boolean;

  // Selection actions
  selectEntity: (entityId: string) => void;
  clearSelection: () => void;

  // Editor actions
  openEditor: (entityId: string) => void;
  closeEditor: () => void;
  isJustClosed: () => boolean;
}

export const BuilderContext = createContext<BuilderContextValue | undefined>(undefined);

interface BuilderProviderProps {
  children: ReactNode;
}

/**
 * BuilderProvider - Manages the "editing session" state for the builder.
 *
 * Uses local state as the source of truth:
 * - Fetches blueprint from API on mount
 * - Local changes update state immediately
 * - Changes are debounced and saved to backend
 */
export const BuilderProvider = ({ children }: BuilderProviderProps) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const justClosedRef = useRef(false);

  const [blueprint, setBlueprintState] = useState<SimulationBlueprint | null>(null);

  // Fetch blueprint from API
  const { refetch } = $api.useQuery("get", "/api/blueprint", {
    enabled: false,
  });
  const justFetchedRef = useRef(false);

  const fetchBlueprint = () => {
    refetch().then((result) => {
      if (result.data) {
        setBlueprintState(result.data);
        justFetchedRef.current = true;
      }
    });
  };

  // Only run this effect on mount
  useEffect(() => fetchBlueprint(), []);

  // Save mutation
  const saveMutation = $api.useMutation("put", "/api/blueprint");

  useEffect(() => {
    if (!blueprint) {
      return;
    }

    if (justFetchedRef.current) {
      justFetchedRef.current = false;
      return;
    }

    saveMutation.mutate({ body: blueprint });
  }, [blueprint]);

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
    setBlueprintState({
      ...currentBlueprint,
      entities: [...currentBlueprint.entities, newEntity],
    });
  };

  const removeEntity = (entityId: string) => {
    setBlueprintState((current) => {
      if (!current) {
        return null;
      }
      return removeBlueprintEntity(current, entityId);
    });
    if (selectedEntityId === entityId) {
      setSelectedEntityId(null);
      setIsEditorOpen(false);
    }
  };

  const updateEntity = (entityId: string, formValues: Record<string, BlueprintEntityParameter>) => {
    if (!blueprint) {
      return;
    }
    // Extract name from formValues if present
    const nameParam = formValues.name;
    const name = nameParam?.parameterType === "primitive" ? String(nameParam.value ?? "") : undefined;

    // Remove name from formValues before updating parameters
    const { name: _, ...parameters } = formValues;

    let updatedBlueprint = updateBlueprintEntityParameters(blueprint, entityId, parameters);
    if (name !== undefined) {
      updatedBlueprint = updateBlueprintEntityName(updatedBlueprint, entityId, name);
    }
    setBlueprintState(updatedBlueprint);
  };

  const moveEntity = (entityId: string, x: number, y: number) => {
    setBlueprintState((current) => {
      if (!current) {
        return null;
      }
      return updateBlueprintEntityPosition(current, entityId, x, y);
    });
  };

  const updateSimParams = (params: Partial<SimulationBlueprint["simParams"]>) => {
    setBlueprintState((current) => {
      const currentSimParams = current?.simParams ?? { initialTime: 0 };
      const nextSimParams = { ...currentSimParams, ...params };
      if (!current) {
        return {
          simParams: nextSimParams,
          entities: [],
        };
      }
      return {
        ...current,
        simParams: nextSimParams,
      };
    });
  };

  const handleSetBlueprint = (newBlueprint: SimulationBlueprint) => {
    setBlueprintState(newBlueprint);
  };

  const updateEntityName = (entityId: string, name: string) => {
    if (!blueprint) {
      return;
    }
    setBlueprintState(updateBlueprintEntityName(blueprint, entityId, name));
  };

  const selectEntity = (entityId: string) => {
    setSelectedEntityId(entityId);
  };

  const clearSelection = () => {
    setSelectedEntityId(null);
  };

  const clearEntities = async () => {
    const result = await saveMutation.mutateAsync({
      body: {
        simParams: blueprint?.simParams ?? { initialTime: 0 },
        entities: [],
      },
    });
    if (result) {
      justFetchedRef.current = true;
      setBlueprintState(result);
    }
  };

  const openEditor = (entityId: string) => {
    if (justClosedRef.current) {
      return;
    }
    setSelectedEntityId(entityId);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setSelectedEntityId(null);
    justClosedRef.current = true;
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
    updateSimParams,
    moveEntity,
    updateEntityName,
    setBlueprint: handleSetBlueprint,
    fetchBlueprint,
    selectEntity,
    clearSelection,
    clearEntities,
    openEditor,
    closeEditor,
    isJustClosed,
    hasEntities: (blueprint?.entities?.length ?? 0) > 0,
  };

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
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

"use client";

import { createContext, ReactNode, useContext, useRef, useState } from "react";

interface EntityEditorContextValue {
  selectedEntityId: string | null;
  isEditorOpen: boolean;
  openEditor: (entityId: string) => void;
  closeEditor: () => void;
  isJustClosed: () => boolean;
}

const EntityEditorContext = createContext<EntityEditorContextValue | undefined>(
  undefined
);

interface EntityEditorProviderProps {
  children: ReactNode;
}

/**
 * EntityEditorProvider - Manages state for the entity editor dialog.
 *
 * Handles opening/closing the editor and prevents reopening immediately after closing.
 */
export const EntityEditorProvider = ({
  children,
}: EntityEditorProviderProps) => {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const justClosedRef = useRef(false);

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

  const value: EntityEditorContextValue = {
    selectedEntityId,
    isEditorOpen,
    openEditor,
    closeEditor,
    isJustClosed,
  };

  return (
    <EntityEditorContext.Provider value={value}>
      {children}
    </EntityEditorContext.Provider>
  );
};

/**
 * Hook to access entity editor state and actions.
 * Must be used within an EntityEditorProvider.
 */
export const useEntityEditor = (): EntityEditorContextValue => {
  const context = useContext(EntityEditorContext);
  if (!context) {
    throw new Error(
      "useEntityEditor must be used within an EntityEditorProvider"
    );
  }
  return context;
};

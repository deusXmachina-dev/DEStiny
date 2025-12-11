"use client";

import { useBuilder } from "@features/builder";
import { useMemo } from "react";

import { Dialog } from "@/components/ui/dialog";

import { useBuilderSchemas } from "../../hooks/useBuilderSchemas";
import type { BlueprintEntityParameter } from "../../types";
import { findBlueprintEntity } from "../../utils";
import { EntityEditorDialog } from "./EntityEditorDialog";
import { EntityEditorForm } from "./EntityEditorForm";

/**
 * Main entity editor component.
 * Coordinates dialog state, data loading, and delegates to dialog/form components.
 */
export const EntityEditor = () => {
  const {
    blueprint,
    selectedEntityId,
    isEditorOpen,
    closeEditor,
    updateEntity,
    removeEntity,
  } = useBuilder();
  const { schemas } = useBuilderSchemas();

  // Load entity data when dialog opens
  const entity = useMemo(() => {
    if (isEditorOpen && selectedEntityId && blueprint) {
      return findBlueprintEntity(blueprint, selectedEntityId) ?? null;
    }
    return null;
  }, [isEditorOpen, selectedEntityId, blueprint]);

  // Find schema for the current entity
  const schema = useMemo(() => {
    if (!entity) {
      return null;
    }
    return schemas.find((s) => s.entityType === entity.entityType) ?? null;
  }, [entity, schemas]);

  if (!entity || !schema || !blueprint) {
    return null;
  }

  const handleSave = (formValues: Record<string, BlueprintEntityParameter>) => {
    if (!selectedEntityId) {
      return;
    }

    updateEntity(selectedEntityId, formValues);
    closeEditor();
  };

  const handleDelete = () => {
    if (!selectedEntityId) {
      return;
    }

    removeEntity(selectedEntityId);
    closeEditor();
  };

  const formId = `entity-editor-form-${selectedEntityId}`;

  return (
    <Dialog open={isEditorOpen} onOpenChange={(open) => !open && closeEditor()}>
      <EntityEditorDialog
        entity={entity}
        formId={formId}
        onDelete={handleDelete}
        onClose={closeEditor}
      >
        {/* Key prop ensures form state resets when entity changes, avoiding cascading renders */}
        <EntityEditorForm
          key={selectedEntityId}
          entity={entity}
          schema={schema}
          blueprint={blueprint}
          onSave={handleSave}
          formId={formId}
        />
      </EntityEditorDialog>
    </Dialog>
  );
};

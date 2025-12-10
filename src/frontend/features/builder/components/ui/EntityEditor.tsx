"use client";

import { useBuilder } from "@features/builder";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useBuilderSchemas } from "../../hooks/useBuilderSchemas";
import type { BuilderEntitySchema, ParameterValue } from "../../types";
import { findBlueprintEntity } from "../../utils";

/**
 * Form component for editing entity parameters.
 * Uses key prop to reset state when entity changes, avoiding cascading renders.
 */
interface EntityFormProps {
  entity: NonNullable<ReturnType<typeof findBlueprintEntity>>;
  schema: BuilderEntitySchema;
  onSave: (formValues: Record<string, ParameterValue>) => void;
  onDelete: () => void;
}

const EntityForm = ({ entity, schema, onSave, onDelete }: EntityFormProps) => {
  const [formValues, setFormValues] = useState<Record<string, ParameterValue>>(
    () => ({ ...entity.parameters }),
  );
  const [inputValues, setInputValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    Object.entries(entity.parameters).forEach(([key, value]) => {
      initial[key] = String(value);
    });
    return initial;
  });

  const handleParameterChange = (key: string, value: string) => {
    const paramType = schema.parameters[key];

    // Always update the input value to allow typing
    setInputValues((prev) => ({ ...prev, [key]: value }));

    if (paramType === "number") {
      // Allow intermediate states, but try to parse valid numbers
      if (value === "" || value === "-" || value === "." || value === "-.") {
        return; // Keep current form value while typing
      }
      const parsed = Number(value);
      if (!isNaN(parsed)) {
        setFormValues((prev) => ({ ...prev, [key]: parsed }));
      }
    } else if (paramType === "boolean") {
      setFormValues((prev) => ({
        ...prev,
        [key]: value === "true" || value === "1",
      }));
    } else {
      setFormValues((prev) => ({ ...prev, [key]: value }));
    }
  };

  const handleBlur = (key: string) => {
    const paramType = schema.parameters[key];
    const value = inputValues[key] ?? "";
    if (paramType === "number") {
      const parsed =
        value === "" || value === "-" || value === "." || value === "-."
          ? 0
          : Number(value);
      const finalValue = isNaN(parsed) ? 0 : parsed;
      setFormValues((prev) => ({ ...prev, [key]: finalValue }));
      setInputValues((prev) => ({ ...prev, [key]: String(finalValue) }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Finalize all number values before submit
    const finalized = { ...formValues };
    Object.entries(schema.parameters).forEach(([key, paramType]) => {
      if (paramType === "number") {
        const value = inputValues[key] ?? "";
        const parsed =
          value === "" || value === "-" || value === "." || value === "-."
            ? 0
            : Number(value);
        finalized[key] = isNaN(parsed) ? 0 : parsed;
      }
    });
    onSave(finalized);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edit Entity: {entity.entityType}</DialogTitle>
        <DialogDescription>
          Modify the parameters for this entity or remove it from the blueprint.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {Object.entries(schema.parameters).map(([key, paramType]) => (
          <div key={key} className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={key} className="text-right capitalize">
              {key}
            </Label>
            <Input
              id={key}
              type="text"
              inputMode={paramType === "number" ? "decimal" : "text"}
              value={inputValues[key] ?? ""}
              onChange={(e) => handleParameterChange(key, e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={() => handleBlur(key)}
              className="col-span-3"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
        ))}
      </div>
      <DialogFooter className="flex-row justify-between">
        <Button type="button" variant="destructive" onClick={onDelete}>
          Delete Entity
        </Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  );
};

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

  if (!entity || !schema) {
    return null;
  }

  const handleSave = (formValues: Record<string, ParameterValue>) => {
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

  return (
    <Dialog open={isEditorOpen} onOpenChange={(open) => !open && closeEditor()}>
      <DialogContent className="sm:max-w-[425px]">
        {/* Key prop ensures form state resets when entity changes, avoiding cascading renders */}
        <EntityForm
          key={selectedEntityId}
          entity={entity}
          schema={schema}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </DialogContent>
    </Dialog>
  );
};

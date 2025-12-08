"use client";

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

import { AVAILABLE_SCHEMAS } from "../../builderSchemas";
import { useEntityEditor } from "../../hooks/EntityEditorContext";
import { useSimulation } from "../../hooks/SimulationContext";
import type { ParameterValue } from "../../types";
import {
  findBlueprintEntity,
  removeBlueprintEntity,
  updateBlueprintEntityParameters,
} from "../../utils";

/**
 * Helper function to find schema by entity type.
 */
const findSchemaByEntityType = (entityType: string) =>
  AVAILABLE_SCHEMAS.find((schema) => schema.entityType === entityType);

/**
 * Form component for editing entity parameters.
 * Uses key prop to reset state when entity changes, avoiding cascading renders.
 */
interface EntityFormProps {
  entity: NonNullable<ReturnType<typeof findBlueprintEntity>>;
  schema: NonNullable<ReturnType<typeof findSchemaByEntityType>>;
  onSave: (formValues: Record<string, ParameterValue>) => void;
  onDelete: () => void;
  onCancel: () => void;
}

const EntityForm = ({ entity, schema, onSave, onDelete, onCancel }: EntityFormProps) => {

  const [formValues, setFormValues] = useState<Record<string, ParameterValue>>(
    () => ({ ...entity.parameters })
  );

  const handleParameterChange = (key: string, value: string) => {
    const paramType = schema.parameters[key];
    let parsedValue: ParameterValue;
    
    if (paramType === "number") {
      parsedValue = value === "" ? 0 : Number(value);
      if (isNaN(parsedValue as number)) {
        return; // Don't update if invalid number
      }
    } else {
      parsedValue = value;
    }

    setFormValues((prev) => ({
      ...prev,
      [key]: parsedValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formValues);
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
              type={paramType === "number" ? "number" : "text"}
              value={formValues[key] ?? ""}
              onChange={(e) => handleParameterChange(key, e.target.value)}
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
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
        >
          Delete Entity
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </DialogFooter>
    </form>
  );
};

export const EntityEditor = () => {
  const { blueprint, setBlueprint, mode } = useSimulation();
  const { selectedEntityId, isEditorOpen, closeEditor } = useEntityEditor();
  
  // Load entity data when dialog opens
  const entity = useMemo(() => {
    if (isEditorOpen && selectedEntityId && blueprint) {
      return findBlueprintEntity(blueprint, selectedEntityId) ?? null;
    }
    return null;
  }, [isEditorOpen, selectedEntityId, blueprint]);

  // Only show in builder mode
  if (mode !== "builder") {
    return null;
  }

  if (!entity) {
    return null;
  }

  const schema = findSchemaByEntityType(entity?.entityType ?? "");
  if (!entity || !schema) {
    return null;
  }

  const handleSave = (formValues: Record<string, ParameterValue>) => {
    if (!blueprint || !selectedEntityId) {
      return;
    }

    const updatedBlueprint = updateBlueprintEntityParameters(
      blueprint,
      selectedEntityId,
      formValues
    );
    setBlueprint(updatedBlueprint);
    closeEditor();
  };

  const handleDelete = () => {
    if (!blueprint || !selectedEntityId) {
      return;
    }

    const updatedBlueprint = removeBlueprintEntity(blueprint, selectedEntityId);
    setBlueprint(updatedBlueprint);
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
          onCancel={closeEditor}
        />
      </DialogContent>
    </Dialog>
  );
};

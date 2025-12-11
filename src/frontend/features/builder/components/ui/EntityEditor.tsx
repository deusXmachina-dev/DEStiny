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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useBuilderSchemas } from "../../hooks/useBuilderSchemas";
import type {
  BlueprintEntityParameter,
  BuilderEntitySchema,
  SimulationBlueprint,
} from "../../types";
import {
  createEntityParameter,
  createPrimitiveParameter,
  findBlueprintEntity,
  getAvailableEntitiesForParameter,
} from "../../utils";

/**
 * Form component for editing entity parameters.
 * Uses key prop to reset state when entity changes, avoiding cascading renders.
 */
interface EntityFormProps {
  entity: NonNullable<ReturnType<typeof findBlueprintEntity>>;
  schema: BuilderEntitySchema;
  blueprint: SimulationBlueprint;
  onSave: (formValues: Record<string, BlueprintEntityParameter>) => void;
  onDelete: () => void;
}

const EntityForm = ({
  entity,
  schema,
  blueprint,
  onSave,
  onDelete,
}: EntityFormProps) => {
  // Initialize form values from entity parameters (dict of BlueprintEntityParameter)
  const [formValues, setFormValues] = useState<
    Record<string, BlueprintEntityParameter>
  >(() => ({ ...entity.parameters }));

  // Input values for primitive parameters (for number input handling)
  const [inputValues, setInputValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    Object.entries(entity.parameters).forEach(([key, param]) => {
      if (param.parameterType === "primitive") {
        initial[key] = String(param.value);
      }
    });
    return initial;
  });

  const handlePrimitiveParameterChange = (key: string, value: string) => {
    const paramInfo = schema.parameters[key];
    if (!paramInfo) return;

    // Always update the input value to allow typing
    setInputValues((prev) => ({ ...prev, [key]: value }));

    // Update form value based on type
    if (paramInfo.type === "number") {
      // Allow intermediate states, but try to parse valid numbers
      if (value === "" || value === "-" || value === "." || value === "-.") {
        return; // Keep current form value while typing
      }
      const parsed = Number(value);
      if (!isNaN(parsed)) {
        setFormValues((prev) => ({
          ...prev,
          [key]: createPrimitiveParameter(key, parsed),
        }));
      }
    } else if (paramInfo.type === "boolean") {
      setFormValues((prev) => ({
        ...prev,
        [key]: createPrimitiveParameter(key, value === "true" || value === "1"),
      }));
    } else {
      setFormValues((prev) => ({
        ...prev,
        [key]: createPrimitiveParameter(key, value),
      }));
    }
  };

  const handleEntityParameterChange = (key: string, uuid: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: createEntityParameter(key, uuid),
    }));
  };

  const handleBlur = (key: string) => {
    const paramInfo = schema.parameters[key];
    if (!paramInfo || paramInfo.type !== "number") return;

    const value = inputValues[key] ?? "";
    const parsed =
      value === "" || value === "-" || value === "." || value === "-."
        ? 0
        : Number(value);
    const finalValue = isNaN(parsed) ? 0 : parsed;
    setFormValues((prev) => ({
      ...prev,
      [key]: createPrimitiveParameter(key, finalValue),
    }));
    setInputValues((prev) => ({ ...prev, [key]: String(finalValue) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Finalize all number values before submit
    const finalized = { ...formValues };
    Object.entries(schema.parameters).forEach(([key, paramInfo]) => {
      if (paramInfo.type === "number") {
        const value = inputValues[key] ?? "";
        const parsed =
          value === "" || value === "-" || value === "." || value === "-."
            ? 0
            : Number(value);
        finalized[key] = createPrimitiveParameter(
          key,
          isNaN(parsed) ? 0 : parsed,
        );
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
        {Object.entries(schema.parameters).map(([key, paramInfo]) => {
          const currentParam = formValues[key];
          const currentValue =
            currentParam?.parameterType === "primitive"
              ? currentParam.value
              : currentParam?.value || "";

          // Entity parameter - show selector
          if (paramInfo.type === "entity") {
            const availableEntities = getAvailableEntitiesForParameter(
              blueprint,
              paramInfo.allowedEntityTypes,
              entity.uuid,
            );

            return (
              <div key={key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={key} className="text-right capitalize">
                  {key}
                </Label>
                <Select
                  value={
                    typeof currentValue === "string" ? currentValue : ""
                  }
                  onValueChange={(value) => handleEntityParameterChange(key, value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an entity" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEntities.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No entities available
                      </div>
                    ) : (
                      availableEntities.map((availableEntity) => (
                        <SelectItem
                          key={availableEntity.uuid}
                          value={availableEntity.uuid}
                        >
                          {availableEntity.entityType} ({availableEntity.uuid.slice(0, 8)}...)
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          // Primitive parameter - show input
          return (
            <div key={key} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={key} className="text-right capitalize">
                {key}
              </Label>
              <Input
                id={key}
                type="text"
                inputMode={paramInfo.type === "number" ? "decimal" : "text"}
                value={inputValues[key] ?? String(currentValue ?? "")}
                onChange={(e) =>
                  handlePrimitiveParameterChange(key, e.target.value)
                }
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
          );
        })}
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

  return (
    <Dialog open={isEditorOpen} onOpenChange={(open) => !open && closeEditor()}>
      <DialogContent className="sm:max-w-[425px]">
        {/* Key prop ensures form state resets when entity changes, avoiding cascading renders */}
        <EntityForm
          key={selectedEntityId}
          entity={entity}
          schema={schema}
          blueprint={blueprint}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </DialogContent>
    </Dialog>
  );
};

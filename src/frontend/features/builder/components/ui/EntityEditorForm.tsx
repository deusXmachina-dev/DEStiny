"use client";

import { useState } from "react";

import type {
  BlueprintEntityParameter,
  BuilderEntitySchema,
  SimulationBlueprint,
} from "../../types";
import { findBlueprintEntity } from "../../utils";
import {
  BooleanParameterInput,
  EntityParameterInput,
  NumberParameterInput,
  StringParameterInput,
} from "./inputs";

interface EntityEditorFormProps {
  entity: NonNullable<ReturnType<typeof findBlueprintEntity>>;
  schema: BuilderEntitySchema;
  blueprint: SimulationBlueprint;
  onSave: (formValues: Record<string, BlueprintEntityParameter>) => void;
  formId: string;
}

/**
 * Form component for editing entity parameters.
 * Uses key prop to reset state when entity changes, avoiding cascading renders.
 */
export const EntityEditorForm = ({
  entity,
  schema,
  blueprint,
  onSave,
  formId,
}: EntityEditorFormProps) => {
  // Initialize form values from entity parameters (dict of BlueprintEntityParameter)
  const [formValues, setFormValues] = useState<
    Record<string, BlueprintEntityParameter>
  >(() => ({ ...entity.parameters }));

  const handleParameterChange = (key: string) => (param: BlueprintEntityParameter) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: param,
    }));
  };

  const performSubmit = () => {
    onSave(formValues);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSubmit();
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        {Object.entries(schema.parameters).map(([key, paramInfo]) => {
          const currentParam = formValues[key];
          const onChange = handleParameterChange(key);

          if (paramInfo.type === "entity") {
            return (
              <EntityParameterInput
                key={key}
                name={key}
                paramInfo={paramInfo}
                value={currentParam}
                blueprint={blueprint}
                excludeUuid={entity.uuid}
                onChange={onChange}
              />
            );
          }

          if (paramInfo.type === "number") {
            return (
              <NumberParameterInput
                key={key}
                name={key}
                paramInfo={paramInfo}
                value={currentParam}
                onChange={onChange}
                onSubmit={performSubmit}
              />
            );
          }

          if (paramInfo.type === "boolean") {
            return (
              <BooleanParameterInput
                key={key}
                name={key}
                paramInfo={paramInfo}
                value={currentParam}
                onChange={onChange}
              />
            );
          }

          // Default to string input
          return (
            <StringParameterInput
              key={key}
              name={key}
              paramInfo={paramInfo}
              value={currentParam}
              onChange={onChange}
              onSubmit={performSubmit}
            />
          );
        })}
      </div>
    </form>
  );
};

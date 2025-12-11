"use client";

import { useState } from "react";

import type {
  BlueprintEntityParameter,
  BuilderEntitySchema,
  SimulationBlueprint,
} from "../../types";
import {
  createEntityParameter,
  createPrimitiveParameter,
  finalizeNumberValue,
  findBlueprintEntity,
  isIntermediateNumberState,
  parseNumberValue,
} from "../../utils";
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
    if (!paramInfo) {
      return;
    }

    // Always update the input value to allow typing
    setInputValues((prev) => ({ ...prev, [key]: value }));

    // Update form value based on type
    if (paramInfo.type === "number") {
      // Allow intermediate states, but try to parse valid numbers
      if (isIntermediateNumberState(value)) {
        return; // Keep current form value while typing
      }
      const parsed = parseNumberValue(value);
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

  const handleNumberBlur = (key: string) => {
    const value = inputValues[key] ?? "";
    const finalValue = finalizeNumberValue(value);
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
        const finalValue = finalizeNumberValue(value);
        finalized[key] = createPrimitiveParameter(key, finalValue);
      }
    });
    onSave(finalized);
  };

  return (
    <form id={formId} onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        {Object.entries(schema.parameters).map(([key, paramInfo]) => {
          const currentParam = formValues[key];

          if (paramInfo.type === "entity") {
            return (
              <EntityParameterInput
                key={key}
                name={key}
                paramInfo={paramInfo}
                value={currentParam}
                blueprint={blueprint}
                excludeUuid={entity.uuid}
                onValueChange={(uuid) => handleEntityParameterChange(key, uuid)}
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
                inputValue={inputValues[key]}
                onInputChange={(value) =>
                  handlePrimitiveParameterChange(key, value)
                }
                onBlur={() => handleNumberBlur(key)}
                onSubmit={handleSubmit}
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
                onValueChange={(value) =>
                  handlePrimitiveParameterChange(key, value)
                }
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
              onValueChange={(value) =>
                handlePrimitiveParameterChange(key, value)
              }
              onSubmit={handleSubmit}
            />
          );
        })}
      </div>
    </form>
  );
};

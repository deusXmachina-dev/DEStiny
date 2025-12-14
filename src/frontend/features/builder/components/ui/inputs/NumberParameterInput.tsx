"use client";

import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { BlueprintEntityParameter, ParameterInfo } from "../../../types";
import {
  createPrimitiveParameter,
  finalizeNumberValue,
  formatDisplayName,
  isIntermediateNumberState,
  parseNumberValue,
} from "../../../utils";

interface NumberParameterInputProps {
  name: string;
  paramInfo: ParameterInfo;
  value: BlueprintEntityParameter | undefined;
  onChange: (param: BlueprintEntityParameter) => void;
  onSubmit?: () => void;
}

export const NumberParameterInput = ({
  name,
  value,
  onChange,
  onSubmit,
}: NumberParameterInputProps) => {
  const currentValue =
    value?.parameterType === "primitive" ? Number(value.value) : 0;

  // Internal state for intermediate typing states (empty, "-", ".", etc.)
  const [inputValue, setInputValue] = useState<string>(String(currentValue));

  // Sync input value when external value changes (e.g., when entity changes)
  useEffect(() => {
    setInputValue(String(currentValue));
  }, [currentValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Update form value if it's a valid number (not intermediate state)
    if (!isIntermediateNumberState(newValue)) {
      const parsed = parseNumberValue(newValue);
      if (!isNaN(parsed)) {
        onChange(createPrimitiveParameter(name, parsed));
      }
    }
  };

  const handleBlur = () => {
    const finalValue = finalizeNumberValue(inputValue);
    setInputValue(String(finalValue));
    onChange(createPrimitiveParameter(name, finalValue));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleBlur(); // Finalize before submit
      onSubmit?.();
    }
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={name} className="text-right">
        {formatDisplayName(name)}
      </Label>
      <Input
        id={name}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        onFocus={(e) => e.target.select()}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="col-span-3"
      />
    </div>
  );
};

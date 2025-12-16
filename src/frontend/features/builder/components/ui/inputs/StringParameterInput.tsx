"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { BlueprintEntityParameter } from "../../../types";
import { createPrimitiveParameter, formatDisplayName } from "../../../utils";

interface StringParameterInputProps {
  name: string;
  value: BlueprintEntityParameter | undefined;
  onChange: (param: BlueprintEntityParameter) => void;
  onSubmit?: () => void;
}

export const StringParameterInput = ({ name, value, onChange, onSubmit }: StringParameterInputProps) => {
  const currentValue = value?.parameterType === "primitive" ? String(value.value ?? "") : "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(createPrimitiveParameter(name, e.target.value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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
        value={currentValue}
        onChange={handleChange}
        onFocus={(e) => e.target.select()}
        onKeyDown={handleKeyDown}
        className="col-span-3"
      />
    </div>
  );
};

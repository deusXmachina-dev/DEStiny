"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { BlueprintEntityParameter, ParameterInfo } from "../../../types";

interface NumberParameterInputProps {
  name: string;
  paramInfo: ParameterInfo;
  value: BlueprintEntityParameter | undefined;
  inputValue: string;
  onInputChange: (value: string) => void;
  onBlur: () => void;
  onSubmit: () => void;
}

export const NumberParameterInput = ({
  name,
  value,
  inputValue,
  onInputChange,
  onBlur,
  onSubmit,
}: NumberParameterInputProps) => {
  const currentValue = value?.parameterType === "primitive" ? value.value : 0;
  const displayValue = inputValue ?? String(currentValue ?? 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onInputChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={name} className="text-right capitalize">
        {name}
      </Label>
      <Input
        id={name}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={(e) => e.target.select()}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        className="col-span-3"
      />
    </div>
  );
};

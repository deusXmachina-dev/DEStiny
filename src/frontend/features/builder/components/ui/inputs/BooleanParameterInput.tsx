"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { BlueprintEntityParameter, ParameterInfo } from "../../../types";
import { createPrimitiveParameter, formatDisplayName } from "../../../utils";

interface BooleanParameterInputProps {
  name: string;
  paramInfo: ParameterInfo;
  value: BlueprintEntityParameter | undefined;
  onChange: (param: BlueprintEntityParameter) => void;
}

export const BooleanParameterInput = ({
  name,
  value,
  onChange,
}: BooleanParameterInputProps) => {
  const currentValue =
    value?.parameterType === "primitive" ? Boolean(value.value) : false;

  const handleChange = (selectedValue: string) => {
    onChange(createPrimitiveParameter(name, selectedValue === "true"));
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={name} className="text-right">
        {formatDisplayName(name)}
      </Label>
      <Select
        value={currentValue ? "true" : "false"}
        onValueChange={handleChange}
      >
        <SelectTrigger className="col-span-3">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">True</SelectItem>
          <SelectItem value="false">False</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

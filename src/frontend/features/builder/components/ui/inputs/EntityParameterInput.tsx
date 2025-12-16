"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { BlueprintEntityParameter, ParameterInfo, SimulationBlueprint } from "../../../types";
import { createEntityParameter, formatDisplayName, getAvailableEntitiesForParameter } from "../../../utils";

interface EntityParameterInputProps {
  name: string;
  paramInfo: ParameterInfo;
  value: BlueprintEntityParameter | undefined;
  blueprint: SimulationBlueprint;
  excludeName?: string;
  onChange: (param: BlueprintEntityParameter) => void;
}

export const EntityParameterInput = ({
  name,
  paramInfo,
  value,
  blueprint,
  excludeName,
  onChange,
}: EntityParameterInputProps) => {
  const currentValue = value?.parameterType === "entity" && typeof value.value === "string" ? value.value : "";

  // Get available entities using utility function
  const availableEntities = getAvailableEntitiesForParameter(blueprint, paramInfo.allowedEntityTypes, excludeName);

  const handleChange = (entityName: string) => {
    onChange(createEntityParameter(name, entityName));
  };

  return (
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor={name} className="text-right">
        {formatDisplayName(name)}
      </Label>
      <Select value={currentValue} onValueChange={handleChange}>
        <SelectTrigger className="col-span-3">
          <SelectValue placeholder="Select an entity" />
        </SelectTrigger>
        <SelectContent>
          {availableEntities.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">No entities available</div>
          ) : (
            availableEntities.map((entity) => (
              <SelectItem key={entity.name} value={entity.name}>
                {entity.name} ({formatDisplayName(entity.entityType)})
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

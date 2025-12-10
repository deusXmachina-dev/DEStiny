"use client";

import type { BuilderEntitySchema } from "../../types";
import { DraggableEntityItem } from "./DraggableEntityItem";
import { cn } from "@/lib/utils";

interface EntityPaletteProps {
  schemas: BuilderEntitySchema[];
  className?: string;
}

export function EntityPalette({ schemas, className }: EntityPaletteProps) {
  const handleDragStart = (e: React.DragEvent, schema: BuilderEntitySchema) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        entityType: schema.entityType,
        parameters: schema.parameters,
      })
    );
  };
  return (
    <div className={cn("grid grid-cols-2 auto-rows-min gap-2", className)}>
      {schemas.map((schema, index) => (
        <DraggableEntityItem
          key={`${schema.entityType}-${index}`}
          schema={schema}
          onDragStart={handleDragStart}
        />
      ))}
    </div>
  );
}

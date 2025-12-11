"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { BuilderEntitySchema } from "../../types";
import { DraggableEntityItem } from "./DraggableEntityItem";

interface EntityPaletteProps {
  schemas: BuilderEntitySchema[];
  isLoading: boolean;
  className?: string;
}

export function EntityPalette({
  schemas,
  isLoading,
  className,
}: EntityPaletteProps) {
  const handleDragStart = (e: React.DragEvent, schema: BuilderEntitySchema) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        entityType: schema.entityType,
        parameters: schema.parameters,
      }),
    );
  };
  return (
    <div className={cn("grid grid-cols-2 auto-rows-min gap-2 h-full overflow-y-auto", className)}>
      {isLoading
        ? Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={`entity-palette-skeleton-${index}`}
              className="h-14 w-auto"
            />
          ))
        : schemas.map((schema, index) => (
            <DraggableEntityItem
              key={`${schema.entityType}-${index}`}
              schema={schema}
              onDragStart={handleDragStart}
            />
          ))}
    </div>
  );
}

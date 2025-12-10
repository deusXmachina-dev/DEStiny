"use client";

import { ClientOnly } from "@/components/common/ClientOnly";
import { SidePanel } from "@/components/common/SidePanel";

import { useBuilderSchemas } from "../hooks/useBuilderSchemas";
import type { BuilderEntitySchema } from "../types";
import { DraggableEntityItem } from "./ui/DraggableEntityItem";
import { RunSimulationButton } from "./ui/RunSimulationButton";

function BuilderPanelContent() {
  const { schemas, isLoading, error } = useBuilderSchemas();

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
    <SidePanel>
      <SidePanel.Content className="grid grid-cols-2 auto-rows-min gap-2">
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading schemas...</div>
        )}
        {error && (
          <div className="text-sm text-destructive">
            Error loading schemas: {error.message}
          </div>
        )}
        {!isLoading &&
          !error &&
          schemas.map((schema, index) => (
            <DraggableEntityItem
              key={`${schema.entityType}-${index}`}
              schema={schema}
              onDragStart={handleDragStart}
            />
          ))}
      </SidePanel.Content>

      <SidePanel.Footer>
        <RunSimulationButton />
      </SidePanel.Footer>
    </SidePanel>
  );
}

export function BuilderPanel() {
  return (
    <ClientOnly>
      <BuilderPanelContent />
    </ClientOnly>
  );
}

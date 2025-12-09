"use client";

import { ClientOnly } from "@/components/common/ClientOnly";
import { SidePanel } from "@/components/common/SidePanel";

import { AVAILABLE_SCHEMAS } from "../builderSchemas";
import { DraggableEntityItem } from "./ui/DraggableEntityItem";
import { ExportBlueprintButton } from "./ui/ExportBlueprintButton";

function BuilderPanelContent() {
  const handleDragStart = (
    e: React.DragEvent,
    schema: (typeof AVAILABLE_SCHEMAS)[0]
  ) => {
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
        {AVAILABLE_SCHEMAS.map((schema, index) => (
          <DraggableEntityItem
            key={`${schema.entityType}-${index}`}
            schema={schema}
            onDragStart={handleDragStart}
          />
        ))}
      </SidePanel.Content>

      <SidePanel.Footer>
        <ExportBlueprintButton />
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

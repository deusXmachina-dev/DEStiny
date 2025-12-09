"use client";

import { SidePanel } from "@/components/common/SidePanel";
import { ClientOnly } from "@/components/common/ClientOnly";

import { AVAILABLE_SCHEMAS } from "../builderSchemas";
import { ExportBlueprintButton } from "./ui/ExportBlueprintButton";

function BuilderPanelContent() {
  const handleDragStart = (e: React.DragEvent, schema: typeof AVAILABLE_SCHEMAS[0]) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/json", JSON.stringify({
      entityType: schema.entityType,
      parameters: schema.parameters,
    }));
  };

  return (
    <SidePanel>
      <SidePanel.Content className="space-y-2">
        {AVAILABLE_SCHEMAS.map((schema) => (
          <div
            key={schema.entityType}
            draggable
            onDragStart={(e) => handleDragStart(e, schema)}
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing"
          >
            <img
              src={schema.icon}
              alt={schema.entityType}
              className="w-12 h-12 object-contain pointer-events-none"
            />
            <div className="flex-1">
              <p className="font-medium text-foreground capitalize pointer-events-none">
                {schema.entityType}
              </p>
            </div>
          </div>
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

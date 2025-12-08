"use client";

import { AVAILABLE_SCHEMAS } from "../builderSchemas";
import { ExportBlueprintButton } from "./ui/ExportBlueprintButton";

export function BuilderPanel() {
  const handleDragStart = (e: React.DragEvent, schema: typeof AVAILABLE_SCHEMAS[0]) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/json", JSON.stringify({
      entityType: schema.entityType,
      parameters: schema.parameters,
    }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Builder</h2>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
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
        </div>
      </div>

      {/* Footer with Export Button */}
      <div className="p-4 border-t border-border">
        <ExportBlueprintButton />
      </div>
    </div>
  );
}

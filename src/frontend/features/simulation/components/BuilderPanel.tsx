"use client";

import { AVAILABLE_SCHEMAS } from "../builderSchemas";

export function BuilderPanel() {
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
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <img
                src={schema.icon}
                alt={schema.entityType}
                className="w-12 h-12 object-contain"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground capitalize">
                  {schema.entityType}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useContext } from "react";
import { useVisualization } from "@features/visualization/hooks/VisualizationContext";
import { BuilderContext } from "../hooks/BuilderContext";
import { EditableEntityName } from "./ui/EditableEntityName";

/**
 * EntityNameOverlay - Renders editable entity names as HTML overlay in builder mode.
 *
 * This component positions editable name inputs over entities based on their
 * world coordinates, accounting for zoom and scroll offset.
 */
export const EntityNameOverlay = () => {
  const { entities, zoom, scrollOffset } = useVisualization();
  const builderContext = useContext(BuilderContext);
  
  // Only render if builder context is available
  if (!builderContext) {
    return null;
  }
  
  const { updateEntityName } = builderContext;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {entities.map((entity) => {
        if (!entity.name) {
          return null;
        }

        // Convert world coordinates to screen coordinates
        // screen = world * zoom + scrollOffset
        const screenX = entity.x * zoom + scrollOffset.x;
        const screenY = entity.y * zoom + scrollOffset.y;

        return (
          <div
            key={entity.entityId}
            className="absolute pointer-events-auto"
            style={{
              left: `${screenX}px`,
              top: `${screenY + 35 * zoom}px`, // Position below entity (matching PixiJS text offset)
              transform: "translate(-50%, 0)", // Center horizontally
            }}
          >
            <EditableEntityName
              entityId={entity.entityId}
              name={entity.name}
              onChange={(name) => updateEntityName(entity.entityId, name)}
            />
          </div>
        );
      })}
    </div>
  );
};

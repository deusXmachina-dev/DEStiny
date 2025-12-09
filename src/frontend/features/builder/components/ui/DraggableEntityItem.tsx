"use client";

import Image from "next/image";
import { useRef } from "react";

import type { AVAILABLE_SCHEMAS } from "../../builderSchemas";

interface DraggableEntityItemProps {
  schema: (typeof AVAILABLE_SCHEMAS)[0];
  onDragStart: (e: React.DragEvent, schema: (typeof AVAILABLE_SCHEMAS)[0]) => void;
}

export function DraggableEntityItem({ schema, onDragStart }: DraggableEntityItemProps) {
  const dragImageRef = useRef<HTMLImageElement>(null);

  const handleDragStart = (e: React.DragEvent) => {
    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 24, 24);
    }
    onDragStart(e, schema);
  };

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing"
      >
        <Image
          src={schema.icon}
          alt={schema.entityType}
          width={48}
          height={48}
          className="w-12 h-12 object-contain pointer-events-none"
        />
        <div className="flex-1">
          <p className="font-medium text-foreground capitalize pointer-events-none">
            {schema.entityType}
          </p>
        </div>
      </div>
      {/* Hidden image for drag preview */}
      <img
        ref={dragImageRef}
        src={schema.icon}
        alt=""
        className="fixed -left-[9999px] w-12 h-12 object-contain"
      />
    </>
  );
}

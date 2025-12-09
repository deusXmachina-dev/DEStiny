"use client";

import Image from "next/image";
import { useRef } from "react";

import type { BuilderEntitySchema } from "../../types";

interface DraggableEntityItemProps {
  schema: BuilderEntitySchema;
  onDragStart: (e: React.DragEvent, schema: BuilderEntitySchema) => void;
}

export function DraggableEntityItem({
  schema,
  onDragStart,
}: DraggableEntityItemProps) {
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
        className="inline-flex items-center gap-2 px-2 py-2 rounded border border-border hover:bg-accent/50 transition-colors cursor-grab active:cursor-grabbing"
      >
        <Image
          src={schema.icon}
          alt={schema.entityType}
          width={48}
          height={48}
          className="w-12 h-12 object-contain pointer-events-none"
        />
        <span className="text-md font-medium text-foreground capitalize pointer-events-none">
          {schema.entityType}
        </span>
      </div>
      {/* Hidden image for drag preview */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={dragImageRef}
        src={schema.icon}
        alt=""
        className="fixed -left-[9999px] w-12 h-12 object-contain"
      />
    </>
  );
}

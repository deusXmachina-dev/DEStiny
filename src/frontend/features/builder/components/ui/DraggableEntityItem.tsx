"use client";

import Image from "next/image";
import { useRef, useState } from "react";

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
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    if (dragImageRef.current && dimensions) {
      // Use half the dimensions as the drag offset (center of image)
      e.dataTransfer.setDragImage(
        dragImageRef.current,
        dimensions.width / 2,
        dimensions.height / 2,
      );
    }
    onDragStart(e, schema);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }
  };

  // Use actual dimensions if available, otherwise fallback to 48x48
  const displayWidth = dimensions?.width ?? 48;
  const displayHeight = dimensions?.height ?? 48;

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
          width={displayWidth}
          height={displayHeight}
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
        className="fixed -left-[9999px] object-contain"
        style={{
          width: dimensions?.width ?? 80,
          height: dimensions?.height ?? 80,
        }}
        onLoad={handleImageLoad}
      />
    </>
  );
}

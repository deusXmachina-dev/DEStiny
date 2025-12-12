"use client";

import { extend } from "@pixi/react";
import { Text as PixiText } from "pixi.js";

// Extend Pixi.js components for @pixi/react
extend({
  Text: PixiText,
});

interface EntityNameProps {
  name: string;
}

/**
 * EntityName - Renders the name label below an entity.
 * Styled with white text, dark outline, and drop shadow for visibility.
 */
export const EntityName = ({ name }: EntityNameProps) => {
  if (!name) {
    return null;
  }

  return (
    <pixiText
      // eslint-disable-next-line react/no-unknown-property
      text={name}
      anchor={0.5}
      x={0}
      y={40}
      // eslint-disable-next-line react/no-unknown-property
      roundPixels
      style={{
        fontFamily: "Inter, system-ui, Arial",
        fontSize: 14,
        fontWeight: "600",

        fill: 0xffffff, // white text
        stroke: {
          color: 0x000000, // dark outline
          width: 2, // thinner outline
          join: "round",
          miterLimit: 2,
        },

        dropShadow: {
          color: 0x000000,
          alpha: 0.35,
          blur: 2,
          distance: 2,
        },

        letterSpacing: 0.5,
        align: "center",
      }}
    />
  );
};

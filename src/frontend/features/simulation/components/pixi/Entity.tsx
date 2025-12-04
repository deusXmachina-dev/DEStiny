"use client";

import { extend } from "@pixi/react";
import { Container, Sprite as PixiSprite } from "pixi.js";
import { SimulationEntityState } from "../../types";
import { useAssets } from "../../hooks/useAssets";

// Extend Pixi.js components for @pixi/react
extend({
    Container,
    Sprite: PixiSprite,
});

export const Entity = ({ entityType, x, y, angle, children }: SimulationEntityState) => {
    const { getTexture } = useAssets();
    const texture = getTexture(entityType);

    return (
        <pixiContainer
            x={x}
            y={y}
            rotation={angle}
        >
            <pixiSprite
                texture={texture}
                anchor={0.5}
                x={0}
                y={0}
                rotation={0}
            />
            {children?.map((child) => (
                <Entity
                    key={child.entityId}
                    {...child}
                />
            ))}
        </pixiContainer>
    );
};


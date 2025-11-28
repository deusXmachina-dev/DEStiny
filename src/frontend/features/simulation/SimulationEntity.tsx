import { extend } from "@pixi/react";
import { Sprite as PixiSprite, Texture } from "pixi.js";

// Extend Pixi.js components for @pixi/react
extend({
    Sprite: PixiSprite,
});

interface SimulationEntityProps {
    x: number;
    y: number;
    angle: number;
    texture: Texture;
}

export const SimulationEntity = ({ x, y, angle, texture }: SimulationEntityProps) => {
    return (
        <pixiSprite
            texture={texture}
            anchor={0.5}
            x={x}
            y={y}
            rotation={angle}
        />
    );
};

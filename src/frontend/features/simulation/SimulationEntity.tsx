import { extend } from "@pixi/react";
import { Container, Sprite as PixiSprite } from "pixi.js";
import { SimulationEntityState } from "./types";
import { useAssets } from "./useAssets";

// Extend Pixi.js components for @pixi/react
extend({
    Container,
    Sprite: PixiSprite,
});

interface SimulationEntityProps {
    id: string;
    type: string;
    x: number;
    y: number;
    angle: number;
    childNodes?: SimulationEntityState[];
}

export const SimulationEntity = ({ type, x, y, angle, childNodes }: SimulationEntityProps) => {
    const { getTexture } = useAssets();
    const texture = getTexture(type);

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
            {childNodes?.map((child) => (
                <SimulationEntity
                    key={child.id}
                    id={child.id}
                    type={child.type}
                    x={child.x}
                    y={child.y}
                    angle={child.angle}
                    childNodes={child.children}
                />
            ))}
        </pixiContainer>
    );
};

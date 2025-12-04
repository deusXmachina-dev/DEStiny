"use client";

import { extend, useApplication } from "@pixi/react";
import { Container, Sprite } from "pixi.js";
import { Entity } from "./Entity";
import { useEntityRenderer } from "../../hooks/useEntityRenderer";
import { useAssets } from "../../hooks/useAssets";
import { useSimulation } from "../../hooks/SimulationContext";
import { calculateSceneOffset } from "../../utils";

// Extend Pixi.js components for @pixi/react
extend({
    Container,
    Sprite,
});

export const Scene = () => {
    const { isLoaded } = useAssets();
    const { app } = useApplication();
    const { boundingBox } = useSimulation();

    const entities = useEntityRenderer();

    if (!isLoaded) {
        return null; // Or a loading spinner
    }

    // Calculate centering offset based on bounding box
    const { offsetX, offsetY } = calculateSceneOffset(
        boundingBox,
        app.screen.width,
        app.screen.height
    );

    return (
        <pixiContainer x={offsetX} y={offsetY}>
            {entities.map((entity) => (
                <Entity
                    key={entity.entityId}
                    {...entity}
                />
            ))}
        </pixiContainer>
    );
};


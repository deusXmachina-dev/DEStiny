import { extend, useApplication } from "@pixi/react";
import { Container, Sprite } from "pixi.js";
import { SimulationEntity } from "./SimulationEntity";
import { useSimulation } from "../../hooks/useSimulation";
import { useAssets } from "../../hooks/useAssets";
import { useSimulationController } from "../../hooks/SimulationContext";
import { calculateSceneOffset } from "../../utils";

// Extend Pixi.js components for @pixi/react
extend({
    Container,
    Sprite,
});

export const SimulationScene = () => {
    const { isLoaded } = useAssets();
    const { app } = useApplication();
    const { boundingBox } = useSimulationController();

    const entities = useSimulation();

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
                <SimulationEntity
                    key={entity.entityId}
                    {...entity}
                />
            ))}
        </pixiContainer>
    );
};


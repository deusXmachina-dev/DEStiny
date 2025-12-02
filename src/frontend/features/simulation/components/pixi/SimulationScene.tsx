import { extend } from "@pixi/react";
import { Container, Sprite } from "pixi.js";
import { SimulationEntity } from "./SimulationEntity";
import { useSimulation } from "../../hooks/useSimulation";
import { useAssets } from "../../hooks/useAssets";

// Extend Pixi.js components for @pixi/react
extend({
    Container,
    Sprite,
});

export const SimulationScene = () => {
    const { isLoaded } = useAssets();

    const entities = useSimulation();

    if (!isLoaded) {
        return null; // Or a loading spinner
    }

    return (
        <pixiContainer>
            {entities.map((entity) => (
                <SimulationEntity
                    key={entity.entityId}
                    {...entity}
                />
            ))}
        </pixiContainer>
    );
};


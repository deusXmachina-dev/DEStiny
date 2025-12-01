import { extend } from "@pixi/react";
import { Container, Sprite } from "pixi.js";
import { SimulationEntity } from "./SimulationEntity";
import { useSimulation } from "./useSimulation";
import { SimulationSnapshot } from "./types";
import { useAssets } from "./useAssets";

// Extend Pixi.js components for @pixi/react
extend({
    Container,
    Sprite,
});

interface SimulationSceneProps {
    isPlaying: boolean;
    speed: number;
    history: SimulationSnapshot[];
}

export const SimulationScene = ({ isPlaying, speed, history }: SimulationSceneProps) => {
    const { isLoaded } = useAssets();

    const entities = useSimulation(history, {
        loop: false,
        speed,
        isPlaying
    });

    if (!isLoaded) {
        return null; // Or a loading spinner
    }

    return (
        <pixiContainer>
            {entities.map((entity) => (
                <SimulationEntity
                    key={entity.id}
                    {...entity}
                />
            ))}
        </pixiContainer>
    );
};

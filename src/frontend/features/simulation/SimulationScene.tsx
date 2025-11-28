import { extend } from "@pixi/react";
import { Container, Sprite, Texture } from "pixi.js";
import { useState } from "react";
import dummyHistory from "./dummySimulationHistory.json";
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
}

export const SimulationScene = ({ isPlaying, speed }: SimulationSceneProps) => {
    const { getTexture, isLoaded } = useAssets();

    // Cast dummy data to typed history
    // In a real app, this would be validated or fetched
    const history = dummyHistory as SimulationSnapshot[];

    const entities = useSimulation(history, {
        loop: true,
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
                    x={entity.x}
                    y={entity.y}
                    angle={entity.angle}
                    texture={getTexture(entity.type)}
                />
            ))}
        </pixiContainer>
    );
};

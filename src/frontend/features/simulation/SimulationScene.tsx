import { extend } from "@pixi/react";
import { Assets, Container, Sprite, Texture } from "pixi.js";
import { useEffect, useState } from "react";
import dummyHistory from "./dummySimulationHistory.json";
import { SimulationEntity } from "./SimulationEntity";
import { useSimulation } from "./useSimulation";
import { SimulationSnapshot } from "./types";

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
    const [texture, setTexture] = useState(Texture.EMPTY);

    // Cast dummy data to typed history
    // In a real app, this would be validated or fetched
    const history = dummyHistory as SimulationSnapshot[];

    const entities = useSimulation(history, {
        loop: false,
        speed,
        isPlaying
    });

    // Load the bunny texture
    useEffect(() => {
        Assets.load("/assets/bunny.png").then((tex) => {
            setTexture(tex);
        });
    }, []);

    if (texture === Texture.EMPTY) {
        return null;
    }

    return (
        <pixiContainer>
            {entities.map((entity) => (
                <SimulationEntity
                    key={entity.id}
                    x={entity.x}
                    y={entity.y}
                    angle={entity.angle}
                    texture={texture}
                />
            ))}
        </pixiContainer>
    );
};

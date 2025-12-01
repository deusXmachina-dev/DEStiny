import { Assets, Texture } from "pixi.js";
import { useEffect, useState } from "react";

const ASSET_MAP: Record<string, string> = {
    agv: "/assets/agv.png",
    box: "/assets/box.png",
    source: "/assets/palette.png",
    sink: "/assets/palette.png",
    store: "/assets/palette.png",
};

export const useAssets = () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadAssets = async () => {
            try {
                // Load all unique asset URLs
                // PixiJS Assets.load() has built-in caching, so repeated loads
                // of the same URL will return the same cached texture
                const uniqueUrls = [...new Set(Object.values(ASSET_MAP))];

                // Use 'skip' strategy to continue loading even if some assets fail
                // This prevents the entire load from failing if one asset is missing
                await Assets.load(uniqueUrls, {
                    strategy: 'skip',
                    onError: (error, asset) => {
                        console.warn(`Failed to load asset: ${asset}`, error);
                    }
                });

                setIsLoaded(true);
            } catch (error) {
                console.error("Failed to load assets:", error);
            }
        };

        loadAssets();
    }, []);

    // Helper to get texture by entity type
    const getTexture = (type: string): Texture => {
        const url = ASSET_MAP[type];
        if (!url) return Texture.EMPTY;

        // Assets.get() retrieves from the built-in cache
        return Assets.get(url) || Texture.EMPTY;
    };

    return { getTexture, isLoaded };
};

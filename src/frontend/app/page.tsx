"use client";

import {
  BuilderInteractionHandler,
  BuilderPanel,
  BuilderProvider,
  EntityEditor,
} from "@features/builder";
import { MetricsPanel } from "@features/metrics";
import {
  PlaybackControls,
  PlaybackProvider,
  usePlayback,
} from "@features/playback";
import {
  SimulationControls,
  SimulationEntityUpdater,
} from "@features/simulation";
import { SceneVisualization } from "@features/visualization/components/SceneVisualization";
import { VisualizationProvider } from "@features/visualization/hooks/VisualizationContext";
import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AppMode = "simulation" | "builder";

function HomeContent() {
  const { hasRecording, pause, seek } = usePlayback();
  const [mode, setMode] = useState<AppMode>("simulation");

  const handleModeChange = (value: string): void => {
    if (value !== "simulation" && value !== "builder") {
      return;
    }

    setMode(value);
    if (value === "builder") {
      pause();
      seek(0);
    }
  };

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Main Content: Fixed Split Panels */}
      <div className="flex-1 min-h-0 w-full flex">
        {/* Left Panel: Visualization (70%) */}
        <div className="w-[70%] h-full relative">
          <VisualizationProvider interactive={mode === "builder"}>
            <SceneVisualization>
              {mode === "simulation" && <SimulationEntityUpdater />}
              {mode === "builder" && <BuilderInteractionHandler />}
            </SceneVisualization>
            {mode === "builder" && <EntityEditor />}
            {mode === "simulation" && (
              <SimulationControls position={hasRecording ? "top" : "center"} />
            )}
          </VisualizationProvider>
        </div>

        {/* Right Panel: Metrics/Builder (30%) */}
        <div className="w-[30%] h-full border-l flex flex-col">
          <Tabs
            value={mode}
            onValueChange={handleModeChange}
            className="flex flex-col h-full gap-0"
          >
            <div className="border-l border-b border-border p-4 flex justify-center">
              <TabsList className="h-10 p-[6px]">
                <TabsTrigger
                  value="simulation"
                  className="text-md p-4 font-mono"
                >
                  Simulation
                </TabsTrigger>
                <TabsTrigger value="builder" className="text-md p-4 font-mono">
                  Builder
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="simulation" className="flex-1 min-h-0 mt-0">
              <MetricsPanel />
            </TabsContent>
            <TabsContent value="builder" className="flex-1 min-h-0 mt-0">
              <BuilderPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      {/* TODO: Only show playback controls if in simulation mode - needs some better resize handling */}
      <div className="border-t border-border shadow-lg">
        <div className="p-4 max-w-7xl mx-auto">
          <PlaybackControls disabled={!hasRecording || mode !== "simulation"} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <BuilderProvider>
      <PlaybackProvider>
        <HomeContent />
      </PlaybackProvider>
    </BuilderProvider>
  );
}

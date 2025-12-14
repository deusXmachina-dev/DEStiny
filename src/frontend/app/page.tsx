"use client";

import {
  BuilderInteractionHandler,
  BuilderPanel,
  EntityEditor,
} from "@features/builder";
import { MetricsPanel } from "@features/metrics";
import { PlaybackControls, usePlayback } from "@features/playback";
import {
  SimulationControls,
  SimulationEntityUpdater,
} from "@features/simulation";
import { SceneVisualization } from "@features/visualization/components/SceneVisualization";
import { VisualizationProvider } from "@features/visualization/hooks/VisualizationContext";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppMode, useAppState } from "@/hooks/AppStateContext";

function HomeContent() {
  const { hasRecording } = usePlayback();
  const { mode, setMode } = useAppState();

  console.debug("HomeContent rerender");

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
            onValueChange={(value) => setMode(value as AppMode)}
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
             {/*  <MetricsPanel /> */}
            </TabsContent>
            <TabsContent value="builder" className="flex-1 min-h-0 mt-0">
              <BuilderPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {mode === "simulation" && (
        <div className="border-t border-border shadow-lg">
          <div className="p-4 max-w-7xl mx-auto">
            <PlaybackControls />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}

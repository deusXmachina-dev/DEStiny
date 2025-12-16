"use client";

import {
  BuilderInteractionHandler,
  BuilderPanel,
  EntityEditor,
} from "@features/builder";
import { MetricsPanel } from "@features/metrics";
import { PlaybackControls, usePlayback } from "@features/playback";
import { SimulationEntityUpdater } from "@features/simulation";
import { SceneVisualization } from "@features/visualization/components/SceneVisualization";
import { VisualizationProvider } from "@features/visualization/hooks/VisualizationContext";
import { useLocalStorage } from "@uidotdev/usehooks";
import { memo, useEffect, useState } from "react";

import { ClientOnly } from "@/components/common/ClientOnly";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { $api } from "@/lib/api-client";

type AppMode = "simulation" | "builder";

// Memoized components to prevent unnecessary re-renders on tab change
const MemoizedSimulationEntityUpdater = memo(SimulationEntityUpdater);
const MemoizedBuilderInteractionHandler = memo(BuilderInteractionHandler);
const MemoizedEntityEditor = memo(EntityEditor);
const MemoizedMetricsPanel = memo(MetricsPanel);
const MemoizedBuilderPanel = memo(BuilderPanel);
const MemoizedPlaybackControls = memo(({ isLoading }: { isLoading: boolean }) => <PlaybackControls isLoading={isLoading} />);

function HomeContent() {
  const { clock, setRecording } = usePlayback();
  const [isStale, setIsStale] = useState(false);
  const [mode, setMode] = useLocalStorage<AppMode>(
    `destiny-app-mode`,
    "builder",
  );

  const simulateMutation = $api.useMutation("post", "/api/simulate");

  // Pause and reset time when switching from simulation to builder
  useEffect(() => {
    if (mode === "builder") {
      clock.pause();
      clock.reset();
    } else if (mode === "simulation") {
      setIsStale(true);
      simulateMutation.mutate(
        {}, // No body needed - uses session blueprint
        {
          onSuccess: (data) => {
            setRecording(data);
            setIsStale(false);
          },
          onError: (error) => {
            console.error("Error simulating recording:", error);
            setIsStale(false);
          },
        },
      );
    }
  }, [mode]);

  console.debug("HomeContent rerender");

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Main Content: Fixed Split Panels */}
      <div className="flex-1 min-h-0 w-full flex">
        {/* Left Panel: Visualization (70%) */}
        <div className="w-[70%] h-full relative">
          <VisualizationProvider interactive={mode === "builder"}>
            <SceneVisualization>
              {mode === "simulation" && !isStale && (
                <MemoizedSimulationEntityUpdater />
              )}
              {mode === "builder" && <MemoizedBuilderInteractionHandler />}
            </SceneVisualization>
            {mode === "builder" && <MemoizedEntityEditor />}
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
              <MemoizedMetricsPanel />
            </TabsContent>
            <TabsContent value="builder" className="flex-1 min-h-0 mt-0">
              <MemoizedBuilderPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {mode === "simulation" && (
        <div className="border-t border-border shadow-lg">
          <div className="p-4 max-w-7xl mx-auto">
            <MemoizedPlaybackControls isLoading={isStale} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <ClientOnly>
      <HomeContent />
    </ClientOnly>
  );
}

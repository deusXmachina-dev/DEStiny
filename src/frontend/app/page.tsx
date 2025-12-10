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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppModeProvider, useAppMode } from "@/hooks/AppModeContext";

function HomeContent() {
  const { hasRecording } = usePlayback();
  const { mode, setMode } = useAppMode();

  const handleModeChange = (value: string): void => {
    if (value !== "simulation" && value !== "builder") {
      return;
    }

    setMode(value as "simulation" | "builder");
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
          {mode === "simulation" && <MetricsPanel />}
          {mode === "builder" && <BuilderPanel />}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      {/* TODO: Only show playback controls if in simulation mode - needs some better resize handling */}
      <div className="border-t border-border shadow-lg">
        <div className="p-4 max-w-7xl mx-auto">
          <PlaybackControls />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <PlaybackProvider>
      <AppModeProvider>
        <BuilderProvider>
          <HomeContent />
        </BuilderProvider>
      </AppModeProvider>
    </PlaybackProvider>
  );
}

"use client";

import {
  BuilderPanel,
  BuilderProvider,
  createBuilderHooks,
  DndProvider,
  EntityEditor,
  useBuilderEntities,
  useCanvasDrop,
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
import { useMemo, useRef } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type AppMode,
  AppStateProvider,
  useAppState,
} from "@/context/AppStateContext";

function HomeContent() {
  const { hasRecording } = usePlayback();
  const { mode, setMode } = useAppState();
  const parentRef = useRef<HTMLDivElement>(null);

  // Builder-specific logic - always call hooks, conditionally use results
  const builderEntitiesFromHook = useBuilderEntities();
  const builderEntities = mode === "builder" ? builderEntitiesFromHook : undefined;
  
  const builderHooks = useMemo(
    () => (mode === "builder" ? createBuilderHooks() : {}),
    [mode]
  );
  
  const dropHandlers = useCanvasDrop(parentRef);
  const { onDragOver, onDrop } = mode === "builder" 
    ? dropHandlers 
    : { onDragOver: undefined, onDrop: undefined };

  const handleTabChange = (value: string) => {
    setMode(value as AppMode);
  };

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Main Content: Fixed Split Panels */}
      <div className="flex-1 min-h-0 w-full flex">
        {/* Left Panel: Visualization (70%) */}
        <div className="w-[70%] h-full">
          <VisualizationProvider entities={builderEntities} hooks={builderHooks}>
            <DndProvider enabled={mode === "builder"}>
              <SceneVisualization
                parentRef={parentRef}
                onDragOver={onDragOver}
                onDrop={onDrop}
              >
                {mode === "simulation" && <SimulationEntityUpdater />}
              </SceneVisualization>
              {mode === "builder" && <EntityEditor />}
              {mode === "simulation" && (
                <SimulationControls position={hasRecording ? "top" : "center"} />
              )}
            </DndProvider>
          </VisualizationProvider>
        </div>

        {/* Right Panel: Metrics/Builder (30%) */}
        <div className="w-[30%] h-full border-l flex flex-col">
          <Tabs
            value={mode}
            onValueChange={handleTabChange}
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
      <div className="border-t border-border shadow-lg">
        <div className="p-4 max-w-7xl mx-auto">
          <PlaybackControls disabled={!hasRecording} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AppStateProvider>
      <BuilderProvider>
        <PlaybackProvider>
          <HomeContent />
        </PlaybackProvider>
      </BuilderProvider>
    </AppStateProvider>
  );
}

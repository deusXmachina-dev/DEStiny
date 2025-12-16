"use client";

import { BuilderInteractionHandler, BuilderPanel, EntityEditor, useBuilder } from "@features/builder";
import { MetricsPanel } from "@features/metrics";
import { PlaybackControls, usePlayback } from "@features/playback";
import { SimulationEntityUpdater } from "@features/simulation";
import { SceneVisualization } from "@features/visualization/components/SceneVisualization";
import { VisualizationProvider } from "@features/visualization/hooks/VisualizationContext";
import { useLocalStorage } from "@uidotdev/usehooks";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import { ClientOnly } from "@/components/common/ClientOnly";
import { Kbd } from "@/components/ui/kbd";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { $api } from "@/lib/api-client";

type AppMode = "simulation" | "builder";

// Memoized components to prevent unnecessary re-renders on tab change
const MemoizedSimulationEntityUpdater = memo(SimulationEntityUpdater);
const MemoizedBuilderInteractionHandler = memo(BuilderInteractionHandler);
const MemoizedEntityEditor = memo(EntityEditor);
const MemoizedMetricsPanel = memo(MetricsPanel);
const MemoizedBuilderPanel = memo(BuilderPanel);

function HomeContent() {
  const { clock, setRecording, hasRecording } = usePlayback();
  const { clearEntities, hasEntities } = useBuilder();
  const [isStale, setIsStale] = useState(false);
  const [mode, setMode] = useLocalStorage<AppMode>(`destiny-app-mode`, "builder");

  // Detect if running on Mac for keyboard shortcut display
  const isMac = typeof window !== "undefined" && /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
  const modifierKey = isMac ? "⌘" : "⌃";
  const simulationEnabled = useMemo(() => hasRecording || hasEntities, [hasRecording, hasEntities]);

  const handleClearEntities = useCallback(async () => {
    setRecording(null);
    await clearEntities();
    setMode("builder");
  }, []);

  // TODO: leverage react-query to refetch simulation recording when blueprint changes
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

  // Keyboard shortcuts for tab switching and blueprint clearing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for cmd+s (Mac) or ctrl+s (Windows/Linux) for Simulation
      if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        if (simulationEnabled) {
          setMode("simulation");
        }
      }
      // Check for cmd+e (Mac) or ctrl+e (Windows/Linux) for Builder
      if ((e.metaKey || e.ctrlKey) && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        setMode("builder");
      }
      // Check for cmd+c (Mac) or ctrl+c (Windows/Linux) to clear blueprint
      if ((e.metaKey || e.ctrlKey) && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        handleClearEntities();
      }
      // space to toggle play/pause
      if (e.key === " ") {
        e.preventDefault();
        clock.togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [simulationEnabled, setMode, clock, handleClearEntities]);

  console.debug("HomeContent rerender");

  return (
    <div className="flex flex-col w-full h-screen">
      {/* Main Content: Fixed Split Panels */}
      <div className="flex-1 min-h-0 w-full flex">
        {/* Left Panel: Visualization (70%) */}
        <div className="w-[70%] h-full relative">
          <button
            onClick={handleClearEntities}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 rounded-md border bg-background/30 px-2 py-1.5 text-xs shadow-sm backdrop-blur-sm transition-all hover:bg-background/50"
          >
            <span className="text-muted-foreground">
              Press <Kbd className="mx-1">{modifierKey}C</Kbd> to clear
            </span>
          </button>
          <VisualizationProvider interactive={mode === "builder"}>
            <SceneVisualization>
              {mode === "simulation" && !isStale && <MemoizedSimulationEntityUpdater />}
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
                <TabsTrigger disabled={!simulationEnabled} value="simulation" className="text-md p-4 font-mono">
                  Simulation
                  <Kbd className="ml-1">{modifierKey}S</Kbd>
                </TabsTrigger>
                <TabsTrigger value="builder" className="text-md p-4 font-mono">
                  Editor
                  <Kbd className="ml-1">{modifierKey}E</Kbd>
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
            <PlaybackControls isLoading={isStale} />
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

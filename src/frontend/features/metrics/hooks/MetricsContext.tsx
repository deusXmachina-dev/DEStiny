"use client";

import { usePlayback } from "@features/playback";
import { useLocalStorage } from "@uidotdev/usehooks";
import { createContext, useContext, useEffect, useMemo } from "react";

import type {
  Metric,
  MetricsSchema,
} from "../index";

interface MetricsConfig {
  visibleMetrics: string[];
  metricOrder: string[];
}

interface MetricsContextValue {
  metrics: MetricsSchema;
  displayedMetrics: Metric[];
  visibleMetrics: Set<string>;
  metricOrder: string[];
  handleToggleVisibility: (metricName: string) => void;
  handleMoveUp: (metricName: string) => void;
  handleMoveDown: (metricName: string) => void;
}

const MetricsContext = createContext<MetricsContextValue | null>(null);

interface MetricsProviderProps {
  children: React.ReactNode;
}

export function MetricsProvider({ children }: MetricsProviderProps) {
  const { recording, simulationName } = usePlayback();
  // Memoize metrics to prevent dependency issues in useEffect and useMemo
  const metrics = useMemo(
    () =>
      recording?.metrics || {
        counter: [],
        gauge: [],
        sample: [],
        state: [],
      },
    [recording?.metrics],
  );
  const [config, setConfig] = useLocalStorage<MetricsConfig>(
    `destiny-metrics-config-${simulationName}`,
    {
      visibleMetrics: [],
      metricOrder: [],
    },
  );

  // Initialize config when metrics change
  useEffect(() => {
    const metricNames = [
      ...metrics.counter.map((m) => m.name),
      ...metrics.gauge.map((m) => m.name),
      ...metrics.sample.map((m) => m.name),
      ...metrics.state.map((m) => m.name),
    ];
    if (metricNames.length === 0) {
      return;
    }

    // Initialize if config is empty or metrics changed
    const hasAllMetrics = metricNames.every((name) =>
      config.metricOrder.includes(name),
    );
    if (config.metricOrder.length === 0 || !hasAllMetrics) {
      setConfig({
        visibleMetrics: metricNames,
        metricOrder: metricNames,
      });
    }
  }, [metrics, config.metricOrder, setConfig]);

  // Derive Set from config for fast lookups
  const visibleMetrics = useMemo(
    () => new Set(config.visibleMetrics),
    [config.visibleMetrics],
  );

  // Handler to toggle visibility of a metric
  const handleToggleVisibility = (metricName: string) => {
    setConfig((prev) => ({
      ...prev,
      visibleMetrics: prev.visibleMetrics.includes(metricName)
        ? prev.visibleMetrics.filter((name) => name !== metricName)
        : [...prev.visibleMetrics, metricName],
    }));
  };

  // Handler to move a metric up in the order
  const handleMoveUp = (metricName: string) => {
    setConfig((prev) => {
      const index = prev.metricOrder.indexOf(metricName);
      if (index <= 0) {
        return prev;
      }

      const newOrder = [...prev.metricOrder];
      const prevItem = newOrder[index - 1];
      const currentItem = newOrder[index];
      if (prevItem !== undefined && currentItem !== undefined) {
        newOrder[index - 1] = currentItem;
        newOrder[index] = prevItem;
      }
      return { ...prev, metricOrder: newOrder };
    });
  };

  // Handler to move a metric down in the order
  const handleMoveDown = (metricName: string) => {
    setConfig((prev) => {
      const index = prev.metricOrder.indexOf(metricName);
      if (index < 0 || index >= prev.metricOrder.length - 1) {
        return prev;
      }

      const newOrder = [...prev.metricOrder];
      const currentItem = newOrder[index];
      const nextItem = newOrder[index + 1];
      if (currentItem !== undefined && nextItem !== undefined) {
        newOrder[index] = nextItem;
        newOrder[index + 1] = currentItem;
      }
      return { ...prev, metricOrder: newOrder };
    });
  };

  // Filter and sort metrics based on visibility and order
  const displayedMetrics = useMemo(() => {
    // Flatten all metrics into a single array
    const allMetrics: Metric[] = [
      ...metrics.counter,
      ...metrics.gauge,
      ...metrics.sample,
      ...metrics.state,
    ];

    // Filter by visibility and sort by metricOrder
    return config.metricOrder
      .filter((name) => visibleMetrics.has(name))
      .map((name) => allMetrics.find((m) => m.name === name))
      .filter((m): m is Metric => m !== undefined);
  }, [metrics, config.metricOrder, visibleMetrics]);

  const value: MetricsContextValue = {
    metrics,
    displayedMetrics,
    visibleMetrics,
    metricOrder: config.metricOrder,
    handleToggleVisibility,
    handleMoveUp,
    handleMoveDown,
  };

  return (
    <MetricsContext.Provider value={value}>{children}</MetricsContext.Provider>
  );
}

export function useMetrics(): MetricsContextValue {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error("useMetrics must be used within MetricsProvider");
  }
  return context;
}

"use client";

import { usePlayback } from "@features/playback";
import { useLocalStorage } from "@uidotdev/usehooks";
import { createContext, useContext, useEffect, useMemo } from "react";

import type { Metric } from "../index";

interface MetricsConfig {
  visibleMetrics: string[];
  metricOrder: string[];
}

interface MetricsContextValue {
  metrics: Metric[];
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
  const metrics = useMemo(() => recording?.metrics || [], [recording?.metrics]);
  const [config, setConfig] = useLocalStorage<MetricsConfig>(
    `destiny-metrics-config-${simulationName}`,
    {
      visibleMetrics: [],
      metricOrder: [],
    },
  );

  // Initialize config when metrics change
  useEffect(() => {
    const metricNames = metrics.map((m) => m.name);
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
      [newOrder[index - 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index - 1],
      ];
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
      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index],
      ];
      return { ...prev, metricOrder: newOrder };
    });
  };

  // Filter and sort metrics based on visibility and order
  const displayedMetrics = useMemo(
    () =>
      config.metricOrder
        .filter((metricName) => visibleMetrics.has(metricName))
        .map((metricName) => metrics.find((m) => m.name === metricName))
        .filter((metric): metric is Metric => metric !== undefined),
    [config.metricOrder, visibleMetrics, metrics],
  );

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

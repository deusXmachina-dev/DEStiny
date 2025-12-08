"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useSimulation } from "../../hooks/SimulationContext";

export function ExportBlueprintButton() {
  const { blueprint } = useSimulation();

  const handleExportBlueprint = () => {
    if (!blueprint) {
      return;
    }

    const jsonString = JSON.stringify(blueprint, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `blueprint-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={handleExportBlueprint}
      disabled={!blueprint}
      className="w-full"
      variant="outline"
    >
      <Download className="mr-2 h-4 w-4" />
      Export Blueprint as JSON
    </Button>
  );
}

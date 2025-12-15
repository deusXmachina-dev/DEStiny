"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { SimulationTheme, THEME_CONFIGS } from "../constants";
import { useVisualization } from "../hooks/VisualizationContext";

const THEME_OPTIONS: { value: SimulationTheme; label: string }[] = Object.keys(
  THEME_CONFIGS,
).map((key) => ({
  value: key as SimulationTheme,
  label: key.charAt(0).toUpperCase() + key.slice(1),
}));

export function ThemeSelector() {
  const { theme, setTheme, getSceneManager } = useVisualization();

  const handleThemeChange = (value: string) => {
    const newTheme = value as SimulationTheme;
    setTheme(newTheme);
    // Directly update BackgroundManager via SceneManager (no React state intermediary)
    const sceneManager = getSceneManager();
    sceneManager?.getBackgroundManager()?.setTheme(newTheme);
  };

  return (
    <Select value={theme} onValueChange={handleThemeChange}>
      <SelectTrigger className="w-[150px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        {THEME_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

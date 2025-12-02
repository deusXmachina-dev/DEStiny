import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSimulationController } from "../../hooks/SimulationContext";
import { SimulationBackgroundTheme, SIMULATION_BACKGROUND_THEME_CONFIGS } from "../../constants";

const THEME_OPTIONS: { value: SimulationBackgroundTheme; label: string }[] = 
    Object.keys(SIMULATION_BACKGROUND_THEME_CONFIGS).map((key) => ({
        value: key as SimulationBackgroundTheme,
        label: key.charAt(0).toUpperCase() + key.slice(1),
    }));

export function ThemeSelector() {
    const { theme, setTheme } = useSimulationController();

    return (
        <Select 
            value={theme} 
            onValueChange={(value) => setTheme(value as SimulationBackgroundTheme)}
        >
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


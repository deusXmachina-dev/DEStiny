import { useSimulationController } from "../../hooks/SimulationContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RotateCcw } from "lucide-react";
import { formatTime } from "../../utils";
import { SPEED_OPTIONS } from "../../constants";

export function PlaybackControls({ disabled = false }: { disabled?: boolean }) {
    const { isPlaying, speed, togglePlay, setSpeed, seek, currentTime, duration } = useSimulationController();

    const handleRestart = () => {
        seek(0);
    };

    return (
        <div className="flex items-center gap-4 w-full">
            {/* Left: Control Buttons */}
            <div className="flex items-center gap-2">
                <Button
                    disabled={disabled}
                    onClick={handleRestart}
                    variant="outline"
                    size="icon"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 size-9"
                    title="Restart"
                >
                    <RotateCcw className="size-4" />
                </Button>
                <Button
                    disabled={disabled}
                    onClick={togglePlay}
                    variant="outline"
                    size="icon"
                    className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 size-9"
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <Pause className="size-4" />
                    ) : (
                        <Play className="size-4" />
                    )}
                </Button>
            </div>

            {/* Center: Timeline */}
            <div className="flex items-center gap-3 flex-1">
                <span className="text-gray-900 font-mono text-sm min-w-[45px]">
                    {formatTime(currentTime)}
                </span>
                <Slider
                    disabled={disabled}
                    id="timeline-slider"
                    value={[currentTime]}
                    min={0}
                    max={duration || 1}
                    step={0.01}
                    onValueChange={(vals) => seek(vals[0])}
                    className="flex-1 **:data-[slot=slider-track]:bg-gray-300 **:data-[slot=slider-range]:bg-gray-700"
                />
                <span className="text-gray-900 font-mono text-sm min-w-[45px]">
                    {formatTime(duration)}
                </span>
            </div>

            {/* Right: Speed Select */}
            <div className="flex items-center gap-2">
                <span className="text-gray-900 text-sm font-medium">Speed:</span>
                    <Select
                        disabled={disabled}
                        value={speed.toString()}
                        onValueChange={(val) => setSpeed(parseFloat(val))}
                    >
                        <SelectTrigger className="w-[90px] bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SPEED_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
            
            </div>
        </div>
    );
}


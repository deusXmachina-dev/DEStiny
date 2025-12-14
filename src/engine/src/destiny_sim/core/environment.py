"""
Simulation environment with motion recording.
"""

import json
import math
from collections import defaultdict
from enum import StrEnum
from pathlib import Path
from typing import TYPE_CHECKING, Any

from simpy import Environment, Timeout

from destiny_sim.core.metrics import MetricsContainer
from destiny_sim.core.timeline import (
    MotionSegment,
    ProgressSegment,
    SimulationRecording,
)

if TYPE_CHECKING:
    from destiny_sim.core.simulation_entity import SimulationEntity


class RecordingEnvironment(Environment):
    """
    Simulation environment that records motion segments.

    All motion recording goes through this class via record_motion().
    """

    def __init__(self, initial_time: float = 0):
        """
        Initialize the environment.

        Args:
            initial_time: The starting simulation time.
        """
        super().__init__(initial_time=initial_time)
        self._motion_segments_by_entity: dict[str, list[MotionSegment]] = defaultdict(list)
        self._progress_segments_by_entity: dict[str, list[ProgressSegment]] = defaultdict(list)
        self._metrics_container = MetricsContainer()

    def incr_counter(self, name: str, amount: int | float = 1, labels: dict[str, str] | None = None) -> None:
        """
        Increment a counter metric.
        
        Args:
            name: Metric name
            amount: Amount to increment by (default 1)
            labels: Optional filtering labels
        """
        self._metrics_container.incr_counter(name, self.now, amount, labels)

    def set_gauge(self, name: str, value: int | float, labels: dict[str, str] | None = None) -> None:
        """
        Set a gauge metric value.
        
        Args:
            name: Metric name
            value: New value
            labels: Optional filtering labels
        """
        self._metrics_container.set_gauge(name, self.now, value, labels)

    def adjust_gauge(self, name: str, delta: int | float, labels: dict[str, str] | None = None) -> None:
        """
        Adjust a gauge metric by a relative amount (delta).
        
        Args:
            name: Metric name
            delta: Amount to change the gauge by (positive to increase, negative to decrease)
            labels: Optional filtering labels
        """
        self._metrics_container.adjust_gauge(name, self.now, delta, labels)

    def record_sample(self, name: str, value: int | float, labels: dict[str, str] | None = None) -> None:
        """
        Record a sample metric observation.
        
        Sample metrics represent independent observations that can be used for statistical
        analysis (histograms, distribution comparisons, etc.). Each call records a new
        independent data point at the current simulation time.
        
        Args:
            name: Metric name
            value: Sample value (e.g., delivery time, service duration)
            labels: Optional filtering labels
        """
        self._metrics_container.record_sample(name, self.now, value, labels)

    def set_state(self, name: str, state: StrEnum, labels: dict[str, str] | None = None) -> None:
        """
        Set a state metric value.
        
        Args:
            name: Metric name
            state: State value (must be a StrEnum member)
            labels: Optional filtering labels
        """
        self._metrics_container.set_state(name, self.now, state, labels)

    def record_disappearance(self, entity: Any, time: float | None = None) -> None:
        """
        Record that an entity has disappeared.
        """
        time = time if time is not None else self.now
        self.record_motion(entity=entity, start_time=time, end_time=time)

    def record_stay(
        self,
        entity: Any,
        start_time: float | None = None,
        end_time: float | None = None,
        duration: float | None = None,
        x: float = 0.0,
        y: float = 0.0,
        angle: float = 0.0,
        parent: "SimulationEntity | None" = None,
    ) -> Timeout:
        """
        Record a stay in location for an entity.

        Returns a timeout event that fires when the stay ends.
        For infinite stays (end_time=None and duration=None), returns timeout(0).

        Args:
            entity: The entity that is staying
            start_time: When the stay begins (defaults to env.now)
            end_time: When the stay ends (None = until simulation end)
            duration: How long the stay lasts (alternative to end_time)
            x: Starting x coordinate
            y: Starting y coordinate
            angle: Starting angle
            parent: If set, coordinates are relative to this parent entity

        Returns:
            Timeout event that fires when the stay ends, or timeout(0) for infinite stays
        """
        return self.record_motion(
            entity,
            start_time=start_time,
            end_time=end_time,
            duration=duration,
            start_x=x,
            start_y=y,
            end_x=x,
            end_y=y,
            start_angle=angle,
            end_angle=angle,
            parent=parent,
        )

    def record_motion(
        self,
        entity: Any,
        start_time: float | None = None,
        end_time: float | None = None,
        duration: float | None = None,
        speed: float | None = None,
        start_x: float = 0.0,
        start_y: float = 0.0,
        end_x: float = 0.0,
        end_y: float = 0.0,
        start_angle: float = 0.0,
        end_angle: float = 0.0,
        parent: "SimulationEntity | None" = None,
    ) -> Timeout:
        """
        Record a motion segment for an entity.

        Returns a timeout event that fires when the motion ends.
        For infinite motion (end_time=None and duration=None), returns timeout(0).

        Args:
            entity: The entity that is moving
            start_time: When the motion begins (defaults to env.now)
            end_time: When the motion ends (None = until simulation end)
            duration: How long the motion takes (alternative to end_time)
            speed: Speed of motion - calculates duration from distance (alternative to duration/end_time)
            start_x, start_y: Starting position
            end_x, end_y: Ending position
            start_angle, end_angle: Starting and ending rotation
            parent: If set, coordinates are relative to this parent entity

        Returns:
            Timeout event that fires when the motion ends, or timeout(0) for infinite motion
        """
        from destiny_sim.core.simulation_entity import SimulationEntity

        if not isinstance(entity, SimulationEntity):
            return self.timeout(0)

        start_time = start_time if start_time is not None else self.now

        # Calculate end_time from duration or speed if provided
        if end_time is None:
            if duration is not None:
                end_time = start_time + duration
            elif speed is not None and speed > 0:
                # Calculate distance from start to end position
                distance = math.hypot(end_x - start_x, end_y - start_y)
                duration = distance / speed
                end_time = start_time + duration
            # else: end_time remains None (infinite motion)

        rendering_info = entity.get_rendering_info()
        segment = MotionSegment(
            entity_id=entity.id,
            entity_type=rendering_info.entity_type,  # Already SimulationEntityType enum
            name=rendering_info.name,
            parent_id=parent.id if parent else None,
            start_time=start_time,
            end_time=end_time,
            start_x=start_x,
            start_y=start_y,
            end_x=end_x,
            end_y=end_y,
            start_angle=start_angle,
            end_angle=end_angle,
        )
        self._motion_segments_by_entity[entity.id].append(segment)

        # Return timeout event for finite motion, timeout(0) for infinite or zero duration
        if end_time is None:
            return self.timeout(0)
        
        calculated_duration = end_time - start_time
        if calculated_duration <= 0:
            return self.timeout(0)
        
        return self.timeout(calculated_duration)

    def record_progress(
        self,
        entity: Any,
        start_time: float | None = None,
        end_time: float | None = None,
        duration: float | None = None,
        start_value: float = 0.0,
        end_value: float = 0.0,
        min_value: float = 0.0,
        max_value: float = 1.0,
    ):
        """
        Record a progress segment for an entity.

        Args:
            entity: The entity whose progress is being tracked
            start_time: When the progress change begins (defaults to env.now)
            end_time: When the progress change ends (None = until simulation end)
            duration: How long the progress change takes (alternative to end_time)
            start_value: Starting progress value
            end_value: Ending progress value
            min_value: Minimum bound for the value
            max_value: Maximum bound for the value
        """
        from destiny_sim.core.simulation_entity import SimulationEntity

        if not isinstance(entity, SimulationEntity):
            return self.timeout(0)

        start_time = start_time if start_time is not None else self.now

        # Calculate end_time from duration if provided
        if end_time is None and duration is not None:
            end_time = start_time + duration

        segment = ProgressSegment(
            entity_id=entity.id,
            start_time=start_time,
            end_time=end_time,
            start_value=start_value,
            end_value=end_value,
            min_value=min_value,
            max_value=max_value,
        )
        self._progress_segments_by_entity[entity.id].append(segment)


    def record_progress_value(
        self,
        entity: Any,
        start_time: float | None = None,
        end_time: float | None = None,
        duration: float | None = None,
        value: float = 0.0,
        min_value: float = 0.0,
        max_value: float = 1.0,
    ):
        """
        Record a constant progress value for an entity.

        Convenience wrapper around record_progress() with start_value == end_value.

        Args:
            entity: The entity whose progress is being tracked
            start_time: When the value change begins (defaults to env.now)
            end_time: When the value change ends (None = until simulation end)
            duration: How long the value change lasts (alternative to end_time)
            value: Constant progress value
            min_value: Minimum bound for the value
            max_value: Maximum bound for the value
        """
        self.record_progress(
            entity,
            start_time=start_time,
            end_time=end_time,
            duration=duration,
            start_value=value,
            end_value=value,
            min_value=min_value,
            max_value=max_value,
        )

    def get_recording(self) -> SimulationRecording:
        """
        Get the complete recording of all motion segments.
        """
        return SimulationRecording(
            duration=self.now,
            motion_segments_by_entity=self._motion_segments_by_entity,
            progress_segments_by_entity=self._progress_segments_by_entity,
            metrics=self._metrics_container.get_all(),
        )

    def save_recording(self, file_path: str) -> None:
        """
        Save the recording to a JSON file.

        Creates directories if needed and prints a confirmation message.

        Args:
            file_path: Path to the output JSON file
                (e.g., "simulation_records/recording.json")
        """
        recording = self.get_recording()

        # Create parent directories if they don't exist
        path = Path(file_path)
        path.parent.mkdir(parents=True, exist_ok=True)

        # Write JSON file
        with open(file_path, "w") as f:
            json.dump(recording.model_dump(by_alias=True), f, indent=2)

        print(f"Recording exported to {file_path}")

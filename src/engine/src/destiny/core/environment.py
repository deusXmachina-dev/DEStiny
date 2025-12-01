"""
Simulation environment with motion recording.
"""
from typing import Any
from simpy import RealtimeEnvironment

from destiny.core.simulation_container import SimulationEntity
from destiny.core.timeline import MotionSegment, SimulationRecording


class Environment(RealtimeEnvironment):
    """
    Simulation environment that records motion segments.
    
    All motion recording goes through this class via record_motion().
    """

    def __init__(self, initial_time: float = 0, factor: float = 1.0):
        """
        Initialize the environment.

        Args:
            initial_time: The starting simulation time.
            factor: Real-time scaling factor (0 = as fast as possible).
        """
        super().__init__(initial_time=initial_time, factor=factor, strict=False)
        self._segments: list[MotionSegment] = []

    def record_motion(
        self,
        entity: Any,
        start_time: float,
        end_time: float | None,
        start_x: float = 0.0,
        start_y: float = 0.0,
        end_x: float = 0.0,
        end_y: float = 0.0,
        start_angle: float = 0.0,
        end_angle: float = 0.0,
        parent: SimulationEntity | None = None,
    ) -> None:
        """
        Record a motion segment for an entity.
        
        Args:
            entity: The entity that is moving
            start_time: When the motion begins
            end_time: When the motion ends (None = until simulation end)
            start_x, start_y: Starting position
            end_x, end_y: Ending position
            start_angle, end_angle: Starting and ending rotation
            parent: If set, coordinates are relative to this parent entity
        """
        if not isinstance(entity, SimulationEntity):
            return None
        
        segment = MotionSegment(
            entity_id=entity.id,
            entity_type=entity._get_entity_type(),
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
        self._segments.append(segment)

    def get_recording(self) -> SimulationRecording:
        """
        Get the complete recording of all motion segments.
        """
        return SimulationRecording(
            duration=self.now,
            segments=self._segments,
        )

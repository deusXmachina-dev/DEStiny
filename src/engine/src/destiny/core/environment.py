"""
Simulation environment with motion recording.
"""
from collections import defaultdict
from typing import TYPE_CHECKING, Any
from simpy import Environment

from destiny.core.timeline import MotionSegment, SimulationRecording

if TYPE_CHECKING:
    from destiny.core.simulation_entity import SimulationEntity


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
        self._segments_by_entity: dict[str, list[MotionSegment]] = defaultdict(list)


    def record_disappearance(self, entity: Any) -> None:
        """
        Record that an entity has disappeared.
        """
        self.record_motion(entity=entity, start_time=self.now, end_time=self.now)

    def record_stay(
        self,
        entity: Any,
        start_time: float | None = None,
        end_time: float | None = None,
        x: float = 0.0,
        y: float = 0.0,
        angle: float = 0.0,
        parent: "SimulationEntity | None" = None,
    ) -> None:
        """
        Record a stay in location for an entity.

        Args:
            entity: The entity that is staying
            start_time: When the stay begins
            x: Starting x coordinate
            y: Starting y coordinate
            angle: Starting angle
            end_time: When the stay ends (None = until simulation end)
            parent: If set, coordinates are relative to this parent entity
        """
        self.record_motion(entity, 
                           start_time=start_time,
                           end_time=end_time,
                           start_x=x,
                           start_y=y,
                           end_x=x,
                           end_y=y,
                           start_angle=angle,
                           end_angle=angle,
                           parent=parent)

    def record_motion(
        self,
        entity: Any,
        start_time: float | None = None,
        end_time: float | None = None,
        start_x: float = 0.0,
        start_y: float = 0.0,
        end_x: float = 0.0,
        end_y: float = 0.0,
        start_angle: float = 0.0,
        end_angle: float = 0.0,
        parent: "SimulationEntity | None" = None,
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
        from destiny.core.simulation_entity import SimulationEntity
        if not isinstance(entity, SimulationEntity):
            return None
        
        start_time = start_time if start_time is not None else self.now
        
        rendering_info = entity.get_rendering_info()
        segment = MotionSegment(
            entity_id=entity.id,
            entity_type=rendering_info.asset_type,
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
        self._segments_by_entity[entity.id].append(segment)

    def get_recording(self) -> SimulationRecording:
        """
        Get the complete recording of all motion segments.
        """
        return SimulationRecording(
            duration=self.now,
            segments_by_entity=self._segments_by_entity,
        )

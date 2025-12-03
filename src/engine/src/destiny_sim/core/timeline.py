"""
Timeline-based recording for simulation playback.

The entire recording is just a list of motion segments. Each segment describes
where an entity is (or moves to) during a time interval, and optionally
its parent for hierarchical rendering.

To record segments use env helper methods.
"""

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class MotionSegment:
    """
    Describes an entity's position/motion during a time interval.

    - entity_id: Unique identifier for the entity
    - entity_type: Type for rendering (e.g., "agv", "box", "source")
    - parent_id: If set, coordinates are relative to parent; if None, world coordinates
    - start_time: When this segment begins
    - end_time: When this segment ends (None = until simulation end)
    - start_x/y, end_x/y: Position at start and end of segment
    - start_angle, end_angle: Rotation at start and end of segment

    Position at time t is computed via linear interpolation.
    """

    entity_id: str
    entity_type: str
    parent_id: str | None
    start_time: float
    end_time: float | None
    start_x: float
    start_y: float
    end_x: float
    end_y: float
    start_angle: float = 0.0
    end_angle: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "entityId": self.entity_id,
            "entityType": self.entity_type,
            "parentId": self.parent_id,
            "startTime": self.start_time,
            "endTime": self.end_time,
            "startX": self.start_x,
            "startY": self.start_y,
            "endX": self.end_x,
            "endY": self.end_y,
            "startAngle": self.start_angle,
            "endAngle": self.end_angle,
        }


@dataclass
class SimulationRecording:
    """
    Complete recording of a simulation run.

    For each component there is a sequence of records
    where the start time of each record needs to be higher than
    start time of previous one for the same component.

    Notes:
    - new record invalidates the previous one
    - to record stay in location, use the same start and end time and coordinates
    - to stay indefinitely, use None for end time
    - to stop rendering of an entity use same start and end time

    """

    duration: float
    segments_by_entity: dict[str, list[MotionSegment]] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "duration": self.duration,
            "segments_by_entity": {
                entity_id: [seg.to_dict() for seg in segments]
                for entity_id, segments in self.segments_by_entity.items()
            },
        }

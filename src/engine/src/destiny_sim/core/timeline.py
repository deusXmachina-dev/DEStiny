"""
Timeline-based recording for simulation playback.

The entire recording is just a list of motion segments. Each segment describes
where an entity is (or moves to) during a time interval, and optionally
its parent for hierarchical rendering.

To record segments use env helper methods.
"""

from pydantic import BaseModel, ConfigDict, Field

from destiny_sim.core.metrics import MetricsSchema
from destiny_sim.core.rendering import SimulationEntityType


class MotionSegment(BaseModel):
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

    model_config = ConfigDict(populate_by_name=True)

    entity_id: str = Field(alias="entityId")
    entity_type: SimulationEntityType = Field(alias="entityType")
    name: str | None = Field(default=None, alias="name")
    parent_id: str | None = Field(default=None, alias="parentId")
    start_time: float = Field(alias="startTime")
    end_time: float | None = Field(default=None, alias="endTime")
    start_x: float = Field(alias="startX")
    start_y: float = Field(alias="startY")
    end_x: float = Field(alias="endX")
    end_y: float = Field(alias="endY")
    start_angle: float = Field(default=0.0, alias="startAngle")
    end_angle: float = Field(default=0.0, alias="endAngle")


class ProgressSegment(BaseModel):
    """
    Describes an entity's progress/value during a time interval.
    
    Value at time t is computed via linear interpolation between
    start_value and end_value. min_value and max_value define the bounds
    for visualization (e.g., 0-100 for percentage, 0-capacity for buffer counts).
    """

    model_config = ConfigDict(populate_by_name=True)

    entity_id: str = Field(alias="entityId")
    start_time: float = Field(alias="startTime")
    end_time: float | None = Field(default=None, alias="endTime")
    start_value: float = Field(alias="startValue")
    end_value: float = Field(alias="endValue")
    min_value: float = Field(alias="minValue")
    max_value: float = Field(alias="maxValue")


class SimulationRecording(BaseModel):
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
    motion_segments_by_entity: dict[str, list[MotionSegment]] = {}
    progress_segments_by_entity: dict[str, list[ProgressSegment]] = {}
    metrics: MetricsSchema = MetricsSchema()

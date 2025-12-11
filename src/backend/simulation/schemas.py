from enum import StrEnum
from typing import Any, Dict, List, Literal

from ninja import Schema

from destiny_sim.core.rendering import SimulationEntityType


class ParameterType(StrEnum):
    """Allowed primitive parameter types for builder entities."""

    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"


ParameterValue = str | int | float | bool


class BuilderEntitySchema(Schema):
    """Schema for a builder entity definition."""

    entityType: str
    parameters: Dict[str, ParameterType]


class SimParams(Schema):
    """Simulation-level parameters shared between frontend and engine."""

    initialTime: float | None = None
    duration: float | None = None


class BlueprintEntity(Schema):
    """Single entity instance in a simulation blueprint."""

    entityType: SimulationEntityType
    uuid: str
    parameters: Dict[str, ParameterValue]


class Blueprint(Schema):
    """
    Simulation blueprint used by the engine.

    This mirrors the structure expected by destiny_sim.builder.runner.run_blueprint
    and by the frontend builder feature.
    """

    simParams: SimParams = SimParams()
    entities: List[BlueprintEntity] = []


class MetricDataSchema(Schema):
    """Schema for metric data with timestamp and value arrays."""

    timestamp: List[float]
    value: List[float]


class MetricSchema(Schema):
    """Serialized metric definition compatible with destiny_sim.core.metrics.Metric."""

    name: str
    type: Literal["gauge", "counter", "sample"]
    labels: Dict[str, str]
    data: MetricDataSchema


class MotionSegmentSchema(Schema):
    """Serialized motion segment compatible with destiny_sim.core.timeline.MotionSegment."""

    entityId: str
    entityType: SimulationEntityType
    parentId: str | None
    startTime: float
    endTime: float | None
    startX: float
    startY: float
    endX: float
    endY: float
    startAngle: float
    endAngle: float


class SimulationRecordingSchema(Schema):
    """Complete simulation recording returned to the frontend."""

    duration: float
    segments_by_entity: Dict[str, List[MotionSegmentSchema]]
    metrics: List[MetricSchema] = []

from typing import Dict, List, Literal

from ninja import Schema

from destiny_sim.core.rendering import SimulationEntityType


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

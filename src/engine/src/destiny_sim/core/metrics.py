"""
Generic tabular metrics system for simulation data collection.

Provides a flexible, columnar data format that can represent any metric type:
- State metrics: counter (total people served), gauge (queue length), enum (machine state)
- Event metrics: sample (package delivery times, service durations), categorical events (voting choices)

All metrics use a columnar format (col_name: [values]) which is efficient for
serialization and frontend consumption.
"""
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic.alias_generators import to_camel


class MetricType(str, Enum):
    """Enumeration of metric types."""
    COUNTER = "counter"
    GAUGE = "gauge"
    SAMPLE = "sample"
    GENERIC = "generic"


class Metric(BaseModel):
    """
    Represents a single metric with columnar tabular data.
    
    A metric has:
    - name: Unique identifier for the metric (e.g., "queue_length", "service_time")
    - type: MetricType enum value (e.g.: COUNTER, GAUGE, or GENERIC) used for visualization
    - labels: Key-value pairs for filtering/grouping (e.g., {"counter_id": "counter_1", "location": "bank"})
    - data: Columnar format dictionary where keys are column names and values are lists
    
    Example:
        Metric(
            name="queue_length",
            type=MetricType.GAUGE,
            labels={"counter_id": "counter_1"},
            data={
                "timestamp": [0.0, 1.5, 3.2, 4.0, 5.5, 6.2],
                "value": [0, 1, 2, 1, 3, 0]
            }
        )

    """
    
    name: str
    type: MetricType
    labels: dict[str, str] = {}
    data: dict[str, list[Any]] = {}

    
    @field_validator("data")
    @classmethod
    def validate_column_lengths(cls, v: dict[str, list[Any]]) -> dict[str, list[Any]]:
        """
        Validate that all columns have the same length.
        
        Raises:
            ValueError: If columns have mismatched lengths
        """
        if not v:
            return v
        
        lengths = {col: len(values) for col, values in v.items()}
        if len(set(lengths.values())) > 1:
            raise ValueError(
                f"Metric has mismatched column lengths: {lengths}"
            )
        return v
    
    def row_count(self) -> int:
        """Return the number of rows in this metric's data."""
        if not self.data:
            return 0
        # All columns should have the same length (validated)
        first_col = next(iter(self.data.values()))
        return len(first_col)
    


class MetricsContainer:
    """
    Container for managing and recording metrics.
    """

    def __init__(self) -> None:
        # Metrics storage: key is (name, sorted_labels_tuple) to ensure uniqueness
        self._metrics: dict[tuple[str, MetricType, tuple[tuple[str, str], ...]], Metric] = {}

    def _get_metric_key(self, name: str, metric_type: MetricType, labels: dict[str, str] | None) -> tuple:
        """Create a unique key for a metric based on name, type and labels."""
        labels_tuple = tuple(sorted(labels.items())) if labels else ()
        return (name, metric_type, labels_tuple)

    def _get_or_create_metric(self, name: str, metric_type: MetricType, labels: dict[str, str] | None) -> Metric:
        """Get existing metric or create a new one."""
        key = self._get_metric_key(name, metric_type, labels)
        if key not in self._metrics:
            self._metrics[key] = Metric(
                name=name,
                type=metric_type,
                labels=labels or {},
                data={"timestamp": [], "value": []}
            )
        return self._metrics[key]

    def incr_counter(self, name: str, time: float, amount: int | float = 1, labels: dict[str, str] | None = None) -> None:
        """
        Increment a counter metric.
        
        Args:
            name: Metric name
            time: Current simulation time
            amount: Amount to increment by (default 1)
            labels: Optional filtering labels
        """
        metric = self._get_or_create_metric(name, MetricType.COUNTER, labels)
        
        current_value = 0
        if metric.data["value"]:
            current_value = metric.data["value"][-1]
            
        new_value = current_value + amount
        metric.data["timestamp"].append(time)
        metric.data["value"].append(new_value)

    def set_gauge(self, name: str, time: float, value: int | float, labels: dict[str, str] | None = None) -> None:
        """
        Set a gauge metric value.
        
        Args:
            name: Metric name
            time: Current simulation time
            value: New value
            labels: Optional filtering labels
        """
        metric = self._get_or_create_metric(name, MetricType.GAUGE, labels)
        metric.data["timestamp"].append(time)
        metric.data["value"].append(value)

    def adjust_gauge(self, name: str, time: float, delta: int | float, labels: dict[str, str] | None = None) -> None:
        """
        Adjust a gauge metric by a relative amount (delta).
        
        Args:
            name: Metric name
            time: Current simulation time
            delta: Amount to change the gauge by (positive to increase, negative to decrease)
            labels: Optional filtering labels
        """
        metric = self._get_or_create_metric(name, MetricType.GAUGE, labels)
        
        current_value = 0
        if metric.data["value"]:
            current_value = metric.data["value"][-1]
            
        new_value = current_value + delta
        metric.data["timestamp"].append(time)
        metric.data["value"].append(new_value)
    
    def record_sample(self, name: str, time: float, value: int | float, labels: dict[str, str] | None = None) -> None:
        """
        Record a sample metric observation.
        
        Sample metrics represent independent observations that can be used for statistical
        analysis (histograms, distribution comparisons, etc.). Each call records a new
        independent data point.
        
        Args:
            name: Metric name
            time: Simulation time when the sample was observed
            value: Sample value (e.g., delivery time, service duration)
            labels: Optional filtering labels
        """
        metric = self._get_or_create_metric(name, MetricType.SAMPLE, labels)
        metric.data["timestamp"].append(time)
        metric.data["value"].append(value)
    
    def get_all(self) -> list[Metric]:
        """Return all recorded metrics."""
        return list(self._metrics.values())

"""
Generic tabular metrics system for simulation data collection.

Provides a flexible, columnar data format that can represent any metric type:
- State metrics: counter (total people served), gauge (queue length), enum (machine state)
- Event metrics: time-series events (queue wait times), categorical events (voting choices)

All metrics use a columnar format (col_name: [values]) which is efficient for
serialization and frontend consumption.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class MetricType(str, Enum):
    """Enumeration of metric types."""
    COUNTER = "counter"
    GAUGE = "gauge"
    GENERIC = "generic"


@dataclass
class Metric:
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
    labels: dict[str, str] = field(default_factory=dict)
    data: dict[str, list[Any]] = field(default_factory=dict)
    
    def validate(self) -> None:
        """
        Validate that all columns have the same length.
        
        Raises:
            ValueError: If columns have mismatched lengths
        """
        if not self.data:
            return
        
        lengths = {col: len(values) for col, values in self.data.items()}
        if len(set(lengths.values())) > 1:
            raise ValueError(
                f"Metric '{self.name}' has mismatched column lengths: {lengths}"
            )
    
    def row_count(self) -> int:
        """Return the number of rows in this metric's data."""
        if not self.data:
            return 0
        # All columns should have the same length (validated)
        first_col = next(iter(self.data.values()))
        return len(first_col)
    
    def to_dict(self) -> dict[str, Any]:
        """
        Convert metric to dictionary for JSON serialization.
        
        Returns:
            Dictionary with camelCase keys for frontend consumption
        """
        return {
            "name": self.name,
            "type": self.type.value,
            "labels": self.labels,
            "data": self.data,
        }
    
    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Metric":
        """
        Create a Metric from a dictionary.
        
        Args:
            data: Dictionary with metric data (from JSON deserialization)
            
        Returns:
            Metric instance
        """
        metric_type = data["type"]
        # Handle both string and MetricType enum values
        if isinstance(metric_type, str):
            metric_type = MetricType(metric_type)
        return cls(
            name=data["name"],
            type=metric_type,
            labels=data.get("labels", {}),
            data=data.get("data", {}),
        )


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
        
    def get_all(self) -> list[Metric]:
        """Return all recorded metrics."""
        return list(self._metrics.values())

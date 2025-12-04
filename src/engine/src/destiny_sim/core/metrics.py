"""
Generic tabular metrics system for simulation data collection.

Provides a flexible, columnar data format that can represent any metric type:
- State metrics: counter (total people served), gauge (queue length), enum (machine state)
- Event metrics: time-series events (queue wait times), categorical events (voting choices)

All metrics use a columnar format (col_name: [values]) which is efficient for
serialization and frontend consumption.
"""
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Metric:
    """
    Represents a single metric with columnar tabular data.
    
    A metric has:
    - name: Unique identifier for the metric (e.g., "queue_length", "service_time")
    - type: Semantic type hint (e.g., "counter", "gauge", "event") used for visualization
    - labels: Key-value pairs for filtering/grouping (e.g., {"counter_id": "counter_1", "location": "bank"})
    - data: Columnar format dictionary where keys are column names and values are lists
    
    Example:
        Metric(
            name="queue_length",
            type="gauge",
            labels={"counter_id": "counter_1"},
            data={
                "timestamp": [0.0, 1.5, 3.2, 4.0, 5.5, 6.2],
                "value": [0, 1, 2, 1, 3, 0]
            }
        )

    """
    
    name: str
    type: str
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
            "type": self.type,
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
        return cls(
            name=data["name"],
            type=data["type"],
            labels=data.get("labels", {}),
            data=data.get("data", {}),
        )

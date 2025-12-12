"""
Generic tabular metrics system for simulation data collection.

Provides a flexible, columnar data format that can represent any metric type:
- State metrics: counter (total people served), gauge (queue length), enum (machine state)
- Event metrics: sample (package delivery times, service durations), categorical events (voting choices)

All metrics use a columnar format (col_name: [values]) which is efficient for
serialization and frontend consumption.
"""
from enum import Enum, StrEnum
from typing import Generic, TypeVar

from pydantic import BaseModel


class MetricType(str, Enum):
    """Enumeration of metric types."""
    COUNTER = "counter"
    GAUGE = "gauge"
    SAMPLE = "sample"
    STATE = "state"
    GENERIC = "generic"


class TimeSeriesMetricData(BaseModel):
    """
    Data for time-series metrics (counter, gauge, sample, generic).
    Timestamp and value are parallel arrays.
    """
    
    timestamp: list[float]
    value: list[float]


class StateMetricData(BaseModel):
    """
    Data for state metrics.
    Timestamp and state are parallel arrays.
    possible_states enumerates all valid state values.
    """
    
    timestamp: list[float]
    state: list[str]
    possible_states: list[str]


T = TypeVar("T", TimeSeriesMetricData, StateMetricData)


class Metric(BaseModel, Generic[T]):
    """
    Represents a single metric with columnar tabular data.
    
    A metric has:
    - name: Unique identifier for the metric (e.g., "queue_length", "service_time")
    - labels: Key-value pairs for filtering/grouping (e.g., {"counter_id": "counter_1", "location": "bank"})
    - data: Metric data (TimeSeriesMetricData or StateMetricData)
    
    Example:
        Metric[TimeSeriesMetricData](
            name="queue_length",
            labels={"counter_id": "counter_1"},
            data=TimeSeriesMetricData(
                timestamp=[0.0, 1.5, 3.2, 4.0, 5.5, 6.2],
                value=[0, 1, 2, 1, 3, 0]
            )
        )

    """
    
    name: str
    labels: dict[str, str] = {}
    data: T


class MetricsSchema(BaseModel):
    """
    Schema that groups metrics by their type.
    Each metric type has its own list of metrics.
    """
    
    counter: list[Metric[TimeSeriesMetricData]] = []
    gauge: list[Metric[TimeSeriesMetricData]] = []
    sample: list[Metric[TimeSeriesMetricData]] = []
    state: list[Metric[StateMetricData]] = []
    generic: list[Metric[TimeSeriesMetricData]] = []


class MetricsContainer:
    """
    Container for managing and recording metrics.
    """

    def __init__(self) -> None:
        # Metrics storage: key is (name, metric_type, sorted_labels_tuple) to ensure uniqueness
        # Value is tuple of (Metric, MetricType) to track type separately
        self._metrics: dict[tuple[str, MetricType, tuple[tuple[str, str], ...]], tuple[Metric, MetricType]] = {}

    def _get_metric_key(self, name: str, metric_type: MetricType, labels: dict[str, str] | None) -> tuple:
        """Create a unique key for a metric based on name, type, and labels."""
        labels_tuple = tuple(sorted(labels.items())) if labels else ()
        return (name, metric_type, labels_tuple)

    def _get_or_create_time_series_metric(self, name: str, metric_type: MetricType, labels: dict[str, str] | None) -> Metric[TimeSeriesMetricData]:
        """Get existing time-series metric or create a new one."""
        key = self._get_metric_key(name, metric_type, labels)
        if key not in self._metrics:
            metric = Metric[TimeSeriesMetricData](
                name=name,
                labels=labels or {},
                data=TimeSeriesMetricData(timestamp=[], value=[])
            )
            self._metrics[key] = (metric, metric_type)
        return self._metrics[key][0]  # type: ignore

    def _get_or_create_state_metric(self, name: str, enum_class: type[StrEnum], labels: dict[str, str] | None) -> Metric[StateMetricData]:
        """Get existing state metric or create a new one."""
        metric_type = MetricType.STATE
        key = self._get_metric_key(name, metric_type, labels)
        if key not in self._metrics:
            possible_states = [member.value for member in enum_class]
            metric = Metric[StateMetricData](
                name=name,
                labels=labels or {},
                data=StateMetricData(timestamp=[], state=[], possible_states=possible_states)
            )
            self._metrics[key] = (metric, metric_type)
        return self._metrics[key][0]  # type: ignore

    def incr_counter(self, name: str, time: float, amount: int | float = 1, labels: dict[str, str] | None = None) -> None:
        """
        Increment a counter metric.
        
        Args:
            name: Metric name
            time: Current simulation time
            amount: Amount to increment by (default 1)
            labels: Optional filtering labels
        """
        metric = self._get_or_create_time_series_metric(name, MetricType.COUNTER, labels)
        
        current_value = 0
        if metric.data.value:
            current_value = metric.data.value[-1]
            
        new_value = current_value + amount
        metric.data.timestamp.append(time)
        metric.data.value.append(new_value)

    def set_gauge(self, name: str, time: float, value: int | float, labels: dict[str, str] | None = None) -> None:
        """
        Set a gauge metric value.
        
        Args:
            name: Metric name
            time: Current simulation time
            value: New value
            labels: Optional filtering labels
        """
        metric = self._get_or_create_time_series_metric(name, MetricType.GAUGE, labels)
        metric.data.timestamp.append(time)
        metric.data.value.append(value)

    def adjust_gauge(self, name: str, time: float, delta: int | float, labels: dict[str, str] | None = None) -> None:
        """
        Adjust a gauge metric by a relative amount (delta).
        
        Args:
            name: Metric name
            time: Current simulation time
            delta: Amount to change the gauge by (positive to increase, negative to decrease)
            labels: Optional filtering labels
        """
        metric = self._get_or_create_time_series_metric(name, MetricType.GAUGE, labels)
        
        current_value = 0
        if metric.data.value:
            current_value = metric.data.value[-1]
            
        new_value = current_value + delta
        metric.data.timestamp.append(time)
        metric.data.value.append(new_value)
    
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
        metric = self._get_or_create_time_series_metric(name, MetricType.SAMPLE, labels)
        metric.data.timestamp.append(time)
        metric.data.value.append(value)
    
    def set_state(self, name: str, time: float, state: StrEnum, labels: dict[str, str] | None = None) -> None:
        """
        Set a state metric value.
        
        Args:
            name: Metric name
            time: Current simulation time
            state: State value (must be a StrEnum member)
            labels: Optional filtering labels
        """
        enum_class = type(state)
        
        metric = self._get_or_create_state_metric(name, enum_class, labels)

        if state.value not in metric.data.possible_states:
            raise ValueError(f"State '{state.value}' is not in possible_states for metric '{name}': {metric.data.possible_states}")
        
        metric.data.timestamp.append(time)
        metric.data.state.append(state.value)
    
    def get_all(self) -> MetricsSchema:
        """Return all recorded metrics grouped by type."""
        schema = MetricsSchema()
        
        for (metric, metric_type) in self._metrics.values():
            if metric_type == MetricType.COUNTER:
                schema.counter.append(metric)
            elif metric_type == MetricType.GAUGE:
                schema.gauge.append(metric)
            elif metric_type == MetricType.SAMPLE:
                schema.sample.append(metric)
            elif metric_type == MetricType.STATE:
                schema.state.append(metric)
            elif metric_type == MetricType.GENERIC:
                schema.generic.append(metric)
        
        return schema

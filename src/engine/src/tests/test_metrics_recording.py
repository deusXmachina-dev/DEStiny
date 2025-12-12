
from enum import StrEnum

from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.metrics import MetricType

def test_counter_metric():
    env = RecordingEnvironment()
    
    # Initial increment
    env.incr_counter("served", 1, {"type": "regular"})
    
    # Run simulation forward
    env.run(until=5.0)
    env.incr_counter("served", 2, {"type": "regular"})
    
    recording = env.get_recording()
    metrics = recording.metrics
    
    assert len(metrics.counter) == 1
    metric = metrics.counter[0]
    assert metric.name == "served"
    assert metric.labels == {"type": "regular"}
    assert metric.data.timestamp == [0.0, 5.0]
    assert metric.data.value == [1, 3]  # 1, then 1+2=3

def test_gauge_metric():
    env = RecordingEnvironment()
    
    env.set_gauge("queue_length", 0)
    env.run(until=2.0)
    env.set_gauge("queue_length", 5)
    env.run(until=4.0)
    env.set_gauge("queue_length", 3)
    
    recording = env.get_recording()
    metrics = recording.metrics
    
    assert len(metrics.gauge) == 1
    metric = metrics.gauge[0]
    assert metric.name == "queue_length"
    assert metric.data.timestamp == [0.0, 2.0, 4.0]
    assert metric.data.value == [0, 5, 3]

def test_adjust_gauge():
    """Test adjusting a gauge with positive and negative deltas."""
    env = RecordingEnvironment()
    
    # Start at 0 implicitly or explicitly set
    env.adjust_gauge("active_agents", 1) # becomes 1
    assert env.now == 0.0
    
    env.run(until=1.0)
    env.adjust_gauge("active_agents", 2) # becomes 3
    
    env.run(until=2.0)
    env.adjust_gauge("active_agents", -1) # becomes 2
    
    env.run(until=3.0)
    env.adjust_gauge("active_agents", -2) # becomes 0
    env.adjust_gauge("active_agents", -1) # becomes -1
    
    recording = env.get_recording()
    metrics = recording.metrics
    metric = metrics.gauge[0]
    
    assert metric.name == "active_agents"
    assert metric.data.timestamp == [0.0, 1.0, 2.0, 3.0, 3.0]
    assert metric.data.value == [1, 3, 2, 0, -1]

def test_multiple_metrics_and_labels():
    env = RecordingEnvironment()
    
    env.incr_counter("served", labels={"id": "1"})
    env.incr_counter("served", labels={"id": "2"})
    
    recording = env.get_recording()
    assert len(recording.metrics.counter) == 2
    
    # Check they are distinct
    m1 = next(m for m in recording.metrics.counter if m.labels["id"] == "1")
    m2 = next(m for m in recording.metrics.counter if m.labels["id"] == "2")
    
    assert m1.data.value == [1]
    assert m2.data.value == [1]

def test_metrics_in_to_dict():
    env = RecordingEnvironment()
    env.incr_counter("test_metric")
    
    data = env.get_recording().model_dump()
    assert "metrics" in data
    assert len(data["metrics"]["counter"]) == 1
    assert data["metrics"]["counter"][0]["name"] == "test_metric"
    assert data["metrics"]["counter"][0]["data"]["value"] == [1]

def test_sample_metric():
    """Test recording sample metrics."""
    env = RecordingEnvironment()
    
    # Record some delivery times (all with same labels so they're in same metric)
    env.record_sample("package_delivery_time", 5.2)
    env.run(until=10.0)
    env.record_sample("package_delivery_time", 8.7)
    env.run(until=15.0)
    env.record_sample("package_delivery_time", 3.1)
    
    recording = env.get_recording()
    metrics = recording.metrics
    
    assert len(metrics.sample) == 1
    metric = metrics.sample[0]
    assert metric.name == "package_delivery_time"
    assert metric.data.timestamp == [0.0, 10.0, 15.0]
    assert metric.data.value == [5.2, 8.7, 3.1]

def test_sample_metric_with_labels():
    """Test that samples with different labels create separate metrics."""
    env = RecordingEnvironment()
    
    env.record_sample("delivery_time", 5.2, labels={"region": "north"})
    env.record_sample("delivery_time", 8.7, labels={"region": "south"})
    
    recording = env.get_recording()
    metrics = recording.metrics
    
    assert len(metrics.sample) == 2
    
    north = next(m for m in metrics.sample if m.labels.get("region") == "north")
    south = next(m for m in metrics.sample if m.labels.get("region") == "south")
    
    assert north.data.value == [5.2]
    assert south.data.value == [8.7]

def test_different_types_same_name():
    """Test that metrics with same name but different types are distinct."""
    env = RecordingEnvironment()
    
    # Create counter
    env.incr_counter("foo")
    
    # Create gauge with same name
    env.set_gauge("foo", 10)
    
    # Create sample with same name
    env.record_sample("foo", 42.0)
    
    recording = env.get_recording()
    metrics = recording.metrics
    
    assert len(metrics.counter) == 1
    assert len(metrics.gauge) == 1
    assert len(metrics.sample) == 1
    
    counter = metrics.counter[0]
    gauge = metrics.gauge[0]
    sample = metrics.sample[0]
    
    assert counter.name == "foo"
    assert gauge.name == "foo"
    assert sample.name == "foo"
    assert counter.data.value == [1]
    assert gauge.data.value == [10]
    assert sample.data.value == [42.0]

def test_state_metric():
    """Test recording state metrics."""
    class MachineState(StrEnum):
        IDLE = "idle"
        PROCESSING = "processing"
        ERROR = "error"
    
    env = RecordingEnvironment()
    
    env.set_state("machine_state", MachineState.IDLE)
    env.run(until=5.0)
    env.set_state("machine_state", MachineState.PROCESSING)
    env.run(until=10.0)
    env.set_state("machine_state", MachineState.IDLE)
    
    recording = env.get_recording()
    metrics = recording.metrics
    
    assert len(metrics.state) == 1
    metric = metrics.state[0]
    assert metric.name == "machine_state"
    assert metric.data.timestamp == [0.0, 5.0, 10.0]
    assert metric.data.state == ["idle", "processing", "idle"]
    assert set(metric.data.possible_states) == {"idle", "processing", "error"}


def test_state_metric_invalid_state():
    """Test that setting an invalid state raises an error."""
    class MachineState(StrEnum):
        IDLE = "idle"
        PROCESSING = "processing"
        
    class InvalidState(StrEnum):
        INVALID = "invalid"
    
    env = RecordingEnvironment()
    
    # Valid state should work
    env.set_state("machine_state", MachineState.IDLE)
    
    # Invalid state - trying to use a string instead of enum member
    # This should raise TypeError since we now require StrEnum
    try:
        env.set_state("machine_state", InvalidState.INVALID)  # type: ignore
        assert False, "Should have raised TypeError"
    except ValueError:
        pass  # Expected

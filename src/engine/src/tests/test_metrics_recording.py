
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
    
    assert len(metrics) == 1
    metric = metrics[0]
    assert metric.name == "served"
    assert metric.type == MetricType.COUNTER
    assert metric.labels == {"type": "regular"}
    assert metric.data["timestamp"] == [0.0, 5.0]
    assert metric.data["value"] == [1, 3]  # 1, then 1+2=3

def test_gauge_metric():
    env = RecordingEnvironment()
    
    env.set_gauge("queue_length", 0)
    env.run(until=2.0)
    env.set_gauge("queue_length", 5)
    env.run(until=4.0)
    env.set_gauge("queue_length", 3)
    
    recording = env.get_recording()
    metrics = recording.metrics
    
    assert len(metrics) == 1
    metric = metrics[0]
    assert metric.name == "queue_length"
    assert metric.type == MetricType.GAUGE
    assert metric.data["timestamp"] == [0.0, 2.0, 4.0]
    assert metric.data["value"] == [0, 5, 3]

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
    metric = metrics[0]
    
    assert metric.name == "active_agents"
    assert metric.type == MetricType.GAUGE
    assert metric.data["timestamp"] == [0.0, 1.0, 2.0, 3.0, 3.0]
    assert metric.data["value"] == [1, 3, 2, 0, -1]

def test_multiple_metrics_and_labels():
    env = RecordingEnvironment()
    
    env.incr_counter("served", labels={"id": "1"})
    env.incr_counter("served", labels={"id": "2"})
    
    recording = env.get_recording()
    assert len(recording.metrics) == 2
    
    # Check they are distinct
    m1 = next(m for m in recording.metrics if m.labels["id"] == "1")
    m2 = next(m for m in recording.metrics if m.labels["id"] == "2")
    
    assert m1.data["value"] == [1]
    assert m2.data["value"] == [1]

def test_metrics_in_to_dict():
    env = RecordingEnvironment()
    env.incr_counter("test_metric")
    
    data = env.get_recording().to_dict()
    assert "metrics" in data
    assert len(data["metrics"]) == 1
    assert data["metrics"][0]["name"] == "test_metric"
    assert data["metrics"][0]["data"]["value"] == [1]

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
    
    assert len(metrics) == 1
    metric = metrics[0]
    assert metric.name == "package_delivery_time"
    assert metric.type == MetricType.SAMPLE
    assert metric.data["timestamp"] == [0.0, 10.0, 15.0]
    assert metric.data["value"] == [5.2, 8.7, 3.1]

def test_sample_metric_with_labels():
    """Test that samples with different labels create separate metrics."""
    env = RecordingEnvironment()
    
    env.record_sample("delivery_time", 5.2, labels={"region": "north"})
    env.record_sample("delivery_time", 8.7, labels={"region": "south"})
    
    recording = env.get_recording()
    metrics = recording.metrics
    
    assert len(metrics) == 2
    
    north = next(m for m in metrics if m.labels.get("region") == "north")
    south = next(m for m in metrics if m.labels.get("region") == "south")
    
    assert north.data["value"] == [5.2]
    assert south.data["value"] == [8.7]

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
    
    assert len(metrics) == 3
    
    counter = next(m for m in metrics if m.type == MetricType.COUNTER)
    gauge = next(m for m in metrics if m.type == MetricType.GAUGE)
    sample = next(m for m in metrics if m.type == MetricType.SAMPLE)
    
    assert counter.name == "foo"
    assert gauge.name == "foo"
    assert sample.name == "foo"
    assert counter.data["value"] == [1]
    assert gauge.data["value"] == [10]
    assert sample.data["value"] == [42.0]

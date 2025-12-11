"""Tests for material flow entities (Source, Sink, Buffer)."""

from destiny_sim.builder.entities.material_flow.buffer import Buffer, BUFFER_NUMBER_OF_ITEMS_METRIC
from destiny_sim.builder.entities.material_flow.sink import Sink, SINK_ITEM_DELIVERED_METRIC
from destiny_sim.builder.entities.material_flow.source import Source, SOURCE_ITEM_PRODUCED_METRIC
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.metrics import MetricType


def test_source_produces_item():
    """Test that Source can produce items and increments counter."""
    env = RecordingEnvironment()
    source = Source(x=0.0, y=0.0)
    
    items_received = []
    
    def consumer():
        # Get an item from the source
        item = yield source.get_item(env)
        items_received.append(item)
    
    env.process(consumer())
    env.run(until=1.0)
    
    # Should have received the item
    assert len(items_received) == 1
    assert items_received[0] == "foo"
    
    # Check that the counter was incremented
    recording = env.get_recording()
    metrics = recording.metrics
    source_metric = next((m for m in metrics if m.name == SOURCE_ITEM_PRODUCED_METRIC), None)
    assert source_metric is not None
    assert source_metric.type == MetricType.COUNTER
    assert source_metric.data.value[-1] == 1


def test_sink_consumes_item():
    """Test that Sink can consume items and increments counter."""
    env = RecordingEnvironment()
    sink = Sink(x=0.0, y=0.0)
    
    def producer():
        # Put an item into the sink
        yield sink.put_item(env, "test_item")
    
    env.process(producer())
    env.run(until=1.0)
    
    # Check that the counter was incremented
    recording = env.get_recording()
    metrics = recording.metrics
    sink_metric = next((m for m in metrics if m.name == SINK_ITEM_DELIVERED_METRIC), None)
    assert sink_metric is not None
    assert sink_metric.type == MetricType.COUNTER
    assert sink_metric.data.value[-1] == 1


def test_buffer_stores_and_retrieves_item():
    """Test that Buffer can store and retrieve items."""
    env = RecordingEnvironment()
    buffer = Buffer(x=0.0, y=0.0, capacity=10.0)
    
    items_received = []
    
    def producer():
        # Put an item into the buffer
        yield buffer.put_item(env, "test_item_1")
        yield buffer.put_item(env, "test_item_2")
    
    def consumer():
        # Get items from the buffer
        yield env.timeout(1.0)
        item1 = yield buffer.get_item(env)
        items_received.append(item1)
        item2 = yield buffer.get_item(env)
        items_received.append(item2)
    
    env.process(producer())
    env.process(consumer())
    env.run(until=10.0)
    
    # Should have received both items
    assert len(items_received) == 2
    assert "test_item_1" in items_received
    assert "test_item_2" in items_received
    
    # Check that gauge was adjusted correctly (should end at 0)
    recording = env.get_recording()
    metrics = recording.metrics
    buffer_metric = next((m for m in metrics if m.name == BUFFER_NUMBER_OF_ITEMS_METRIC), None)
    assert buffer_metric is not None
    assert buffer_metric.type == MetricType.GAUGE
    assert buffer_metric.data.value == [1, 2, 1, 0]


def test_buffer_respects_capacity():
    """Test that Buffer respects its capacity limit."""
    env = RecordingEnvironment()
    buffer = Buffer(x=0.0, y=0.0, capacity=2.0)
    
    items_put = []
    
    def producer():
        # Try to put more items than capacity
        for i in range(5):
            yield buffer.put_item(env, f"item_{i}")
            items_put.append(env.now)
    
    env.process(producer())
    env.run(until=10.0)
    
    # Should have put at least 2 items (capacity)
    assert len(items_put) >= 2
    
    # Check that store has correct capacity
    store = buffer._get_store(env)
    assert store.capacity == 2.0

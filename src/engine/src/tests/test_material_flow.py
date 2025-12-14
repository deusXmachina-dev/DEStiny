"""Tests for material flow entities (Source, Sink, Buffer, ManufacturingCell, Control)."""  # noqa: E501

import pytest

from destiny_sim.builder.entities.material_flow.buffer import (
    BUFFER_NUMBER_OF_ITEMS_METRIC,
    Buffer,
)
from destiny_sim.builder.entities.material_flow.control import (
    Control,
)
from destiny_sim.builder.entities.material_flow.manufacturing_cell import (
    ManufacturingCell,
)
from destiny_sim.builder.entities.material_flow.sink import (
    SINK_ITEM_DELIVERED_METRIC,
    Sink,
)
from destiny_sim.builder.entities.material_flow.source import (
    SOURCE_ITEM_PRODUCED_METRIC,
    Source,
)
from destiny_sim.core.environment import RecordingEnvironment


def test_source_produces_item():
    """Test that Source can produce items and increments counter."""
    env = RecordingEnvironment()
    source = Source(name="Test Source", x=0.0, y=0.0)
    
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
    source_metric = next(
        (
            m
            for m in metrics.counter
            if m.name == f"{SOURCE_ITEM_PRODUCED_METRIC} {source.name}"
        ),
        None,
    )
    assert source_metric is not None
    assert source_metric.data.value[-1] == 1


def test_sink_consumes_item():
    """Test that Sink can consume items and increments counter."""
    env = RecordingEnvironment()
    sink = Sink(name="Test Sink", x=0.0, y=0.0)
    
    def producer():
        # Put an item into the sink
        yield sink.put_item(env, "test_item")
    
    env.process(producer())
    env.run(until=1.0)
    
    # Check that the counter was incremented
    recording = env.get_recording()
    metrics = recording.metrics
    sink_metric = next(
        (
            m
            for m in metrics.counter
            if m.name == f"{SINK_ITEM_DELIVERED_METRIC} {sink.name}"
        ),
        None,
    )
    assert sink_metric is not None
    assert sink_metric.data.value[-1] == 1


def test_buffer_stores_and_retrieves_item():
    """Test that Buffer can store and retrieve items."""
    env = RecordingEnvironment()
    buffer = Buffer(name="Test Buffer", x=0.0, y=0.0, capacity=10.0)
    
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
    buffer_metric = next(
        (
            m
            for m in metrics.gauge
            if m.name == f"{BUFFER_NUMBER_OF_ITEMS_METRIC} {buffer.name}"
        ),
        None,
    )
    assert buffer_metric is not None
    assert buffer_metric.data.value == [1, 2, 1, 0]


def test_buffer_respects_capacity():
    """Test that Buffer respects its capacity limit."""
    env = RecordingEnvironment()
    buffer = Buffer(name="Test Buffer", x=0.0, y=0.0, capacity=2.0)
    
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


def test_manufacturing_cell_processes_items():
    """Test ManufacturingCell processes items from input to output buffer."""
    env = RecordingEnvironment()
    
    # Create buffers and manufacturing cell
    buffer_in = Buffer(name="Input Buffer", x=0.0, y=0.0, capacity=10.0)
    buffer_out = Buffer(name="Output Buffer", x=100.0, y=100.0, capacity=10.0)
    cell = ManufacturingCell(
        name="Manufacturing Cell",
        x=50.0,
        y=50.0,
        input=buffer_in,
        output=buffer_out,
        mean=1.0,  # Mean processing time
        std_dev=0.5,  # Standard deviation
    )
    
    items_processed = []
    
    def producer():
        # Put items into input buffer
        yield buffer_in.put_item(env, "item_1")
        yield buffer_in.put_item(env, "item_2")
        yield buffer_in.put_item(env, "item_3")
    
    def consumer():
        # Get items from output buffer
        while True:
            item = yield buffer_out.get_item(env)
            items_processed.append((env.now, item))
            if len(items_processed) >= 3:
                break
    
    # Start processes
    env.process(producer())
    env.process(cell.process(env))
    env.process(consumer())
    
    # Run simulation
    env.run(until=100.0)
    
    # Should have processed all 3 items
    assert len(items_processed) == 3
    assert all(item[1] in ["item_1", "item_2", "item_3"] for item in items_processed)

@pytest.mark.parametrize("nok_probability", [0.0, 1.0])
def test_control_routes_items(nok_probability):
    """Test Control routes items to ok_output or nok_output based on probability."""
    env = RecordingEnvironment()
    
    # Create outputs
    ok_sink = Sink(name="OK Sink", x=100.0, y=0.0)
    nok_sink = Sink(name="NOK Sink", x=0.0, y=100.0)
    
    control = Control(
        name="Control Station",
        x=50.0,
        y=50.0,
        ok_output=ok_sink,
        nok_output=nok_sink,
        nok_probability=nok_probability,
    )
    
    def producer():
        yield control.put_item(env, "item_1")
    
    env.process(producer())
    env.run()
    
    expected_ok = 1 if nok_probability == 0.0 else 0
    expected_nok = 1 if nok_probability == 1.0 else 0
    
    assert ok_sink.items_delivered == expected_ok
    assert nok_sink.items_delivered == expected_nok

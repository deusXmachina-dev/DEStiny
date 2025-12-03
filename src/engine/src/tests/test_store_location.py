"""Tests for StoreLocation."""

import pytest

from destiny_sim.agv.store_location import StoreLocation
from destiny_sim.core.environment import RecordingEnvironment


@pytest.fixture
def env():
    return RecordingEnvironment()


def test_store_location_initialization(env):
    loc = StoreLocation(env, x=10.0, y=20.0)
    assert loc.x == 10.0
    assert loc.y == 20.0
    assert loc.store.capacity == float("inf")


def test_store_location_records_motion(env):
    loc = StoreLocation(env, x=10.0, y=20.0)

    recording = env.get_recording()
    segments = recording.segments_by_entity.get(loc.id, [])

    assert len(segments) == 1
    seg = segments[0]
    assert seg.start_x == 10.0
    assert seg.end_x == 10.0
    assert seg.start_y == 20.0
    assert seg.end_y == 20.0
    assert seg.end_time is None  # Until simulation end


def test_store_location_initial_items(env):
    items = ["item1", "item2"]
    loc = StoreLocation(env, x=0, y=0, initial_items=items)
    assert len(loc.store.items) == 2


def test_store_location_put_get(env):
    loc = StoreLocation(env, x=0, y=0)

    def producer(env, loc):
        yield loc.put_item("item1")
        yield loc.put_item("item2")

    def consumer(env, loc):
        item1 = yield loc.get_item()
        assert item1 == "item1"
        item2 = yield loc.get_item()
        assert item2 == "item2"

    env.process(producer(env, loc))
    env.process(consumer(env, loc))
    env.run()


def test_store_location_distance(env):
    loc1 = StoreLocation(env, x=0, y=0)
    loc2 = StoreLocation(env, x=3, y=4)
    assert loc1.distance_to(loc2) == 5.0

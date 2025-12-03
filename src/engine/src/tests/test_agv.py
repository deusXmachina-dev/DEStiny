"""Tests for AGV motion recording."""

import pytest

from destiny_sim.agv.agv import AGV
from destiny_sim.agv.items import Box
from destiny_sim.agv.location import Location
from destiny_sim.agv.planning import TripPlan, Waypoint, WaypointType
from destiny_sim.agv.store_location import StoreLocation
from destiny_sim.core.environment import RecordingEnvironment


@pytest.fixture
def env():
    return RecordingEnvironment()


def test_agv_records_initial_position(env):
    agv = AGV(env, start_location=Location(100, 200), speed=10.0)

    plan = TripPlan([Waypoint(Location(200, 200), WaypointType.PASS)])
    agv.schedule_plan(env, plan)
    env.run(until=20)

    recording = env.get_recording()
    agv_segments = recording.segments_by_entity.get(agv.id, [])

    # First segment is initial position, second is the movement
    assert len(agv_segments) >= 1
    assert agv_segments[0].start_x == 100
    assert agv_segments[0].start_y == 200


def test_agv_records_motion_segments(env):
    agv = AGV(env, start_location=Location(0, 0), speed=10.0)

    plan = TripPlan(
        [
            Waypoint(Location(100, 0), WaypointType.PASS),
            Waypoint(Location(100, 50), WaypointType.PASS),
        ]
    )
    agv.schedule_plan(env, plan)
    env.run(until=20)

    recording = env.get_recording()
    agv_segments = recording.segments_by_entity.get(agv.id, [])

    # Initial + 2 movements
    assert len(agv_segments) == 3

    # Check second segment (first movement)
    seg1 = agv_segments[1]
    assert seg1.start_x == 0
    assert seg1.end_x == 100
    assert seg1.end_y == 0

    # Check third segment (second movement)
    seg2 = agv_segments[2]
    assert seg2.start_x == 100
    assert seg2.end_x == 100
    assert seg2.end_y == 50


def test_agv_records_carried_item_motion(env):
    agv = AGV(env, start_location=Location(0, 0), speed=10.0)
    source = StoreLocation(env, x=0, y=0, initial_items=[Box()])
    sink = StoreLocation(env, x=100, y=0)

    plan = TripPlan(
        [
            Waypoint(source, WaypointType.SOURCE),
            Waypoint(sink, WaypointType.SINK),
        ]
    )
    agv.schedule_plan(env, plan)
    env.run(until=20)

    recording = env.get_recording()

    # Find box segments (should have parent = agv while carried
    all_segments = [
        s for segments in recording.segments_by_entity.values() for s in segments
    ]
    box_segments = [s for s in all_segments if s.entity_type == "box"]
    assert len(box_segments) >= 1

    assert all(s.parent_id == agv.id for s in box_segments)


def test_agv_transport_item(env):
    agv = AGV(env, start_location=Location(0, 0), speed=1.0)
    source = StoreLocation(env, x=0, y=0, initial_items=["payload"])
    sink = StoreLocation(env, x=10, y=0)

    plan = TripPlan(
        [
            Waypoint(source, WaypointType.SOURCE),
            Waypoint(sink, WaypointType.SINK),
        ]
    )
    agv.schedule_plan(env, plan)
    env.run()

    assert len(source.store.items) == 0
    assert len(sink.store.items) == 1
    assert sink.store.items[0] == "payload"


def test_agv_availability(env):
    agv = AGV(env, start_location=Location(0, 0), speed=1.0)

    plan = TripPlan([Waypoint(Location(10, 0), WaypointType.PASS)])
    agv.schedule_plan(env, plan)

    env.run(until=5)
    assert agv.is_available() is False

    env.run(until=15)
    assert agv.is_available() is True

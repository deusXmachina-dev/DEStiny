import pytest
from destiny.agv.agv import AGV
from destiny.agv.location import Location
from destiny.agv.planning import TripPlan, Waypoint, WaypointType
from destiny.agv.store_location import StoreLocation
from destiny.core.environment import TickingEnvironment

@pytest.fixture
def env():
    return TickingEnvironment(tick_interval=1.0, factor=0)


def test_agv_movement(env):
    agv = AGV(start_location=Location(0, 0))
    env.add_child(agv)

    target_loc = Location(10, 0)
    waypoint = Waypoint(target_loc, WaypointType.PASS)
    plan = TripPlan([waypoint])

    agv.schedule_plan(env, plan)
    env.run(until=10.1)
    
    # Check snapshot has data now
    snap = agv.snapshot(env.now)
    assert snap is not None
    assert snap.x == 10.0
    assert snap.y == 0.0

    assert agv.is_available() is True

def test_agv_mid_trip(env):    
    agv = AGV(start_location=Location(0, 0), speed=1.0)
    env.add_child(agv)
    source_loc = StoreLocation(env, 0, 0, initial_items=["payload"])
    sink_loc = StoreLocation(env, 10, 0)

    plan = TripPlan([
        Waypoint(source_loc, WaypointType.SOURCE),
        Waypoint(sink_loc, WaypointType.SINK)])

    agv.schedule_plan(env, plan)
    env.run(until=5)

    assert agv.is_available() is False
    assert len(source_loc.store.items) == 0
    assert len(sink_loc.store.items) == 0

    snap = agv.snapshot(env.now)
    assert snap is not None
    assert snap.x == 5
    assert snap.y == 0.0

def test_agv_transport_item(env):
    agv = AGV(start_location=Location(0, 0), speed=1.0)
    env.add_child(agv)
    source_loc = StoreLocation(env, 0, 0, initial_items=["payload"])
    env.add_child(source_loc)
    sink_loc = StoreLocation(env, 10, 0)

    plan = TripPlan([
        Waypoint(source_loc, WaypointType.SOURCE),
        Waypoint(sink_loc, WaypointType.SINK)])

    agv.schedule_plan(env, plan)
    env.run()
    # Verify item moved
    # StoreLocation internal store checks
    assert len(source_loc.store.items) == 0
    assert len(sink_loc.store.items) == 1
    assert sink_loc.store.items[0] == "payload"

def test_agv_queueing(env):
    agv = AGV(start_location=Location(0, 0), speed=1.0)
    env.add_child(agv)

    # Plan 1: 0 -> 10 (10s)
    target1 = Location(10, 0)
    plan1 = TripPlan([Waypoint(target1, WaypointType.PASS)])
    
    # Plan 2: 10 -> 20 (10s)
    target2 = Location(20, 0)
    plan2 = TripPlan([Waypoint(target2, WaypointType.PASS)])

    # Execute Plan 1
    agv.schedule_plan(env, plan1)
    
    # Execute Plan 2 immediately (should queue)
    agv.schedule_plan(env, plan2)

    # Run for 15s. Should be done with Plan 1 (10s) and midway Plan 2 (5s into Plan 2).
    # Total distance: 10 + 5 = 15. Pos: 15, 0.
    env.run(until=15)

    snap = agv.snapshot(env.now)
    assert snap.x == 15.0
    assert snap.y == 0.0
    assert agv.is_available() is False

    # Run until completion
    env.run(until=21)
    snap = agv.snapshot(env.now)
    assert snap.x == 20.0
    assert agv.is_available() is True

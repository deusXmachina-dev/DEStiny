
import json
from dataclasses import asdict
from destiny.agv.agv import AGV
from destiny.agv.items import Box
from destiny.agv.location import Location
from destiny.agv.planning import TripPlan, Waypoint, WaypointType
from destiny.agv.store_location import StoreLocation
from destiny.core.environment import TickingEnvironment


def _prepare_simulation():
    env = TickingEnvironment(tick_interval=0.1, factor=0)

    start_loc = Location(x=500, y=500)

    agv = AGV(start_location=start_loc, speed=100.0)
    env.add_child(agv)

    source_loc = StoreLocation(env, x=150, y=500, initial_items=[Box(), Box(), Box()])
    env.add_child(source_loc)

    sink_loc = StoreLocation(env, x=500, y=150)
    env.add_child(sink_loc)

    plan = TripPlan([
        Waypoint(source_loc, WaypointType.SOURCE),
        Waypoint(sink_loc, WaypointType.SINK),
        Waypoint(start_loc, WaypointType.PASS),
        Waypoint(source_loc, WaypointType.SOURCE),
        Waypoint(sink_loc, WaypointType.SINK),
        Waypoint(start_loc, WaypointType.PASS),
        ])

    agv.schedule_plan(env, plan)
    return env

def main():
    env = _prepare_simulation()

    all_snapshots = []
    for step_snapshot in env.iterate(until=30):
        all_snapshots.append(step_snapshot)

    print(f"Collected {len(all_snapshots)} snapshots")
    if all_snapshots:
        print(f"Last snapshot: {all_snapshots[-1]}")

    with open("simulation_snapshots.json", "w") as f:
        json.dump([asdict(s) for s in all_snapshots], f, indent=2)
    print("Snapshots exported to simulation_snapshots.json")


if __name__ == "__main__":
    main()

"""
Simple AGV example: one AGV moving boxes between a source and sink.
"""
import json

from destiny.agv.agv import AGV
from destiny.agv.items import Box
from destiny.agv.location import Location
from destiny.agv.planning import TripPlan, Waypoint, WaypointType
from destiny.agv.store_location import StoreLocation
from destiny.core.environment import Environment


def main():
    env = Environment(factor=0)

    start_loc = Location(x=500, y=500)
    agv = AGV(env, start_location=start_loc, speed=100.0)

    source_loc = StoreLocation(env, x=150, y=500, initial_items=[Box(), Box(), Box()])
    sink_loc = StoreLocation(env, x=500, y=150)

    plan = TripPlan([
        Waypoint(source_loc, WaypointType.SOURCE),
        Waypoint(sink_loc, WaypointType.SINK),
        Waypoint(start_loc, WaypointType.PASS),
        Waypoint(source_loc, WaypointType.SOURCE),
        Waypoint(sink_loc, WaypointType.SINK),
        Waypoint(start_loc, WaypointType.PASS),
    ])

    agv.schedule_plan(env, plan)

    # Run simulation
    print("Running simulation for 30 seconds...")
    env.run(until=30)
    print("Simulation complete.")

    # Export recording
    recording = env.get_recording()
    print(f"Recorded {len(recording.segments)} motion segments")

    with open("agv_box_recording.json", "w") as f:
        json.dump(recording.to_dict(), f, indent=2)
    print("Recording exported to agv_box_recording.json")


if __name__ == "__main__":
    main()

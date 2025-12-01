"""
Grid fleet simulation example.

Demonstrates multiple AGVs moving boxes between sources and sinks on a grid.
"""
import json
from typing import List

from destiny.agv.agv import AGV
from destiny.agv.items import Box
from destiny.agv.site_graph import GridSiteGraph
from destiny.agv.store_location import Source, Sink
from destiny.agv.fleet_manager import FleetManager, TaskProvider
from destiny.core.environment import Environment


def main():
    env = Environment(factor=0)

    # Create Grid (20x10, spacing 50) - Dimensions: 1000 x 500
    grid = GridSiteGraph(width=20, height=10, spacing=50.0, diagonals=True)

    # Sources on the left side
    source_coords = [(1, 1), (5, 1), (8, 1)]
    
    # Sinks on the right side
    sink_coords = [(2, 18), (7, 18)]
    
    sources: List[Source] = []
    sinks: List[Sink] = []

    for r, c in source_coords:
        node = grid.get_node_at(r, c)
        source = Source(env, x=node.x, y=node.y, initial_items=[Box() for _ in range(50)])
        grid.insert_location(source)
        sources.append(source)

    for r, c in sink_coords:
        node = grid.get_node_at(r, c)
        sink = Sink(env, x=node.x, y=node.y)
        grid.insert_location(sink)
        sinks.append(sink)

    print(f"Initialized {len(sources)} sources and {len(sinks)} sinks.")

    # Initialize Fleet Manager
    task_provider = TaskProvider(sources=sources, sinks=sinks)
    fleet_manager = FleetManager(task_provider, grid)

    # Add 3 AGVs in the middle
    agv_start_coords = [(4, 10), (5, 10), (6, 10)]
    
    for i, (r, c) in enumerate(agv_start_coords):
        start_node = grid.get_node_at(r, c)
        agv = AGV(start_location=start_node, speed=50.0)
        fleet_manager.add_agv(agv)
        print(f"AGV {i+1} created at ({start_node.x}, {start_node.y})")

    env.process(fleet_manager.plan_indefinitely(env))

    # Run simulation
    simulation_time = 600
    print(f"Running simulation for {simulation_time} seconds...")
    env.run(until=simulation_time)
    print("Simulation complete.")

    # Export recording
    recording = env.get_recording()
    print(f"Recorded {len(recording.segments)} motion segments")

    with open("grid_fleet_recording.json", "w") as f:
        json.dump(recording.to_dict(), f, indent=2)
    print("Recording exported to grid_fleet_recording.json")


if __name__ == "__main__":
    main()

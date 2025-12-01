import json
import random
from dataclasses import asdict
from typing import List, Tuple

from destiny.agv.agv import AGV
from destiny.agv.items import Box
from destiny.agv.site_graph import GridSiteGraph
from destiny.agv.store_location import StoreLocation
from destiny.agv.fleet_manager import FleetManager, TaskProvider
from destiny.core.environment import TickingEnvironment

def main():
    # 1. Initialize Environment
    # tick_interval=0.1 means 10 ticks per simulation second
    env = TickingEnvironment(tick_interval=0.1, factor=0)

    # 2. Create Grid (20x10, spacing 50)
    # Dimensions: 1000 x 500
    grid = GridSiteGraph(width=20, height=10, spacing=50.0, diagonals=True)

    # 3. Prepare Locations
    # Define predetermined locations (Row, Col)
    # Grid is 10 rows (0-9) x 20 cols (0-19)
    
    # Sources on the left side
    source_coords = [
        (1, 1),  # Top-leftish
        (5, 1),  # Mid-left
        (8, 1)   # Bottom-leftish
    ]
    
    # Sinks on the right side
    sink_coords = [
        (2, 18), # Top-rightish
        (7, 18)  # Bottom-rightish
    ]
    
    sources: List[StoreLocation] = []
    sinks: List[StoreLocation] = []

    # Add Sources
    for r, c in source_coords:
        original_node = grid.get_node_at(r, c)
        
        # Create a source with some initial items
        source = StoreLocation(
            env, 
            x=original_node.x, 
            y=original_node.y, 
            initial_items=[Box() for _ in range(50)]
        )
        
        grid.insert_location(source)
        sources.append(source)

    # Add Sinks
    for r, c in sink_coords:
        original_node = grid.get_node_at(r, c)
        
        sink = StoreLocation(
            env, 
            x=original_node.x, 
            y=original_node.y
        )
        
        grid.insert_location(sink)
        sinks.append(sink)

    print(f"Initialized {len(sources)} sources and {len(sinks)} sinks.")

    # 4. Initialize Task Provider and Fleet Manager
    task_provider = TaskProvider(sources=sources, sinks=sinks)
    fleet_manager = FleetManager(task_provider, grid)
    env.add_child(fleet_manager)

    # 5. Add 3 AGVs
    # Place AGVs in the middle column
    agv_start_coords = [(4, 10), (5, 10), (6, 10)]
    
    for i, (r, c) in enumerate(agv_start_coords):
        start_node = grid.get_node_at(r, c)
        
        # Speed 50.0 means it takes 1 second to travel one grid unit (spacing 50)
        agv = AGV(start_location=start_node, speed=50.0)
        fleet_manager.add_child(agv)
        print(f"AGV {i+1} created at ({start_node.x}, {start_node.y})")

    # Start the Fleet Manager's planning process
    env.process(fleet_manager.plan_indefinitely(env))

    # 6. Run Simulation
    simulation_time = 600 # seconds
    print(f"Running simulation for {simulation_time} seconds...")
    
    all_snapshots = []
    for step_snapshot in env.iterate(until=simulation_time):
        all_snapshots.append(step_snapshot)

    print(f"Simulation complete. Collected {len(all_snapshots)} snapshots.")

    # 7. Export Results
    output_file = "grid_fleet_snapshots.json"
    with open(output_file, "w") as f:
        json.dump([asdict(s) for s in all_snapshots], f, indent=2)
    
    print(f"Snapshots exported to {output_file}")

if __name__ == "__main__":
    main()


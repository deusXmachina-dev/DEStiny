# DEStiny

**DEStiny** is a discrete event simulation engine built on top of [SimPy](https://simpy.readthedocs.io/). It adds a layer of abstraction for **recording simulation events** (movement, stays) to be visualized in a frontend application.

It is designed for:
- Any discrete event simulation where spatial visualization is key

With examples in place for
- AGV (Automated Guided Vehicle) simulations

## Installation

```bash
pip install destiny-sim
```

## Quick Start

Here is a minimal example of a simulation recording:

```python
import json
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.simulation_entity import SimulationEntity
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType

# 1. Define your entities
class Robot(SimulationEntity):
    def get_rendering_info(self):
        return RenderingInfo(entity_type=SimulationEntityType.ROBOT)

# 2. Create the environment
env = RecordingEnvironment()
robot = Robot()

# 3. Define simulation logic
def robot_process(env, robot):
    # Record initial position
    env.record_stay(robot, x=0, y=0, start_time=env.now)
    yield env.timeout(1)
    
    # Move to (10, 10) over 5 seconds
    env.record_motion(
        entity=robot,
        start_time=env.now,
        end_time=env.now + 5,
        start_x=0, start_y=0,
        end_x=10, end_y=10
    )
    yield env.timeout(5)

env.process(robot_process(env, robot))

# 4. Run and Export
env.run(until=10)
recording = env.get_recording()

with open("recording.json", "w") as f:
    json.dump(recording.to_dict(), f, indent=2)

print("Simulation complete! saved to recording.json")
```

## Features

- **RecordingEnvironment**: Drop-in replacement for `simpy.Environment` that tracks entity states.
- **Spatial Graph**: Includes `GridSiteGraph` for navigation and pathfinding.
- **AGV Logic**: Built-in support for AGVs, Tasks, and Fleet Management.

## License

MIT License

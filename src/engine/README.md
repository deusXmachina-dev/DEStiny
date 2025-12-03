# DEStiny

![DEStiny AGVs demo GIF](doc-assets/destiny.gif)

**DEStiny** is a discrete event simulation engine built on top of [SimPy](https://simpy.readthedocs.io/). It extends SimPy by adding a standardized layer for **recording simulation events** (such as movement) which can then be visualized in a [companion frontend application](https://destiny.deusxmachina.dev/).

It allows you to focus on the logic of your simulation while automatically handling the generation of playback data for debugging and presentation.

## Installation

```bash
pip install destiny-sim
```

## Quick Start

Here is a minimal example showing a simple entity walking between points.

```python
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity

# 1. Define your entity by inheriting from SimulationEntity
class Person(SimulationEntity):
    def __init__(self, x: float, y: float):
        super().__init__()
        self.x = x
        self.y = y

    # Define how this entity should look in the visualizer
    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.HUMAN)

    # Define the simulation process for this entity
    def walk_sequence(self, env: RecordingEnvironment):
        # Walk to (500, 300) over 5 seconds
        yield from self._walk_to(env, 500.0, 300.0, duration=5)
        # Walk to (800, 100) over 5 seconds
        yield from self._walk_to(env, 800.0, 100.0, duration=5)

    def _walk_to(self, env: RecordingEnvironment, target_x: float, target_y: float, duration: float):
        # Record the motion event
        env.record_motion(
            self,
            start_time=env.now,
            end_time=env.now + duration,
            start_x=self.x,
            start_y=self.y,
            end_x=target_x,
            end_y=target_y,
        )
        
        # Update internal state and wait for the duration
        self.x = target_x
        self.y = target_y
        yield env.timeout(duration)

# 2. Run the simulation
env = RecordingEnvironment()
person = Person(x=100.0, y=100.0)
env.process(person.walk_sequence(env))

env.run()

# 3. Save the recording
env.save_recording("simple_walk_recording.json")
print("Simulation complete! Saved to simple_walk_recording.json")
```

### Key Concepts

DEStiny adds a few core concepts on top of SimPy:

- **`SimulationEntity`**: The base class for any object you want to track in the visualization. You must implement `get_rendering_info()` to tell the visualizer what sprite or shape to use.
- **`env.record_motion(...)`**: A method on the `RecordingEnvironment` that logs a movement event. This does not affect the simulation logic itself (you still use `yield env.timeout(...)` for time passing), but it generates the data needed for smooth interpolation in the viewer.

For more usage patterns, check the [examples](src/examples) folder. The most complete example is the [AGV Grid Fleet Simulation](src/examples/grid_fleet_simulation.py), which demonstrates a fleet of AGVs moving boxes between sources and sinks.

## Visualization

Once you have generated a recording JSON file, you can visualize it using our web viewer:

👉 **[Open Simulation Viewer](https://destiny.deusxmachina.dev/)**

## Why was this project created

Commercial GUI-first simulation tools are often clunky, expensive, and overkill for many use cases (aiming for hyper-realism rather than simple modelling). They also tend to have steep learning curves and don't play well with modern development workflows or LLMs.

We love **SimPy** as an idiomatic way to program both agents and processes in Python. However, we felt it was missing an opinionated structure for things like visualization and metrics collection.

**DEStiny** aims to bridge this gap. It provides the code-first flexibility of SimPy with a lightweight, standardized way to record and visualize what actually happens in your simulation.

## Roadmap

We are at the beginning of our journey with DEStiny. We are releasing this initial version to collect feedback and see if we are heading in the right direction.

Next we are planning to add:
- metrics collection API
- richer and more flexible visualization
- LLM friendly docs
- use case specific packages (similar to the AGV package)
- user managed asset libraries
- tooling to create the sim scenarios directly in the frontend

There are many more things we could work on (such as support for physical units) - that is why we'll appreaciate your feedback on what you would like to see us add next. Feel free also to open up a PR with proposed changes.

## License

MIT License

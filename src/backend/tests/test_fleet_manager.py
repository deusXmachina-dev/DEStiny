from typing import Any, Generator

from simpy import Timeout

from destiny.agv.agv import AGV
from destiny.agv.fleet_manager import FleetManager, TaskProvider
from destiny.agv.location import Location
from destiny.agv.planning import AGVTask
from destiny.agv.site_graph import SiteGraph
from destiny.agv.store_location import StoreLocation
from destiny.core.environment import TickingEnvironment


class DeterministicTaskProvider(TaskProvider):
    """A test helper that returns specific tasks immediately."""
    def __init__(self, tasks: list[AGVTask]):
        # We don't need sources/sinks for this mock, pass empty lists
        super().__init__([], [])
        self.tasks = tasks
        self.task_index = 0

    def get_next_task(self, env: TickingEnvironment) -> Generator[Timeout, Any, AGVTask]:
        if self.task_index < len(self.tasks):
            yield env.timeout(0)
            task = self.tasks[self.task_index]
            self.task_index += 1
            return task
        else:
            yield env.timeout(100000)
            return None


def test_fleet_manager_full_integration():
    """Strategy 3: Full Functionality Test"""
    env = TickingEnvironment(tick_interval=1.0, factor=0)
    
    # Setup graph with env
    # We need to make sure L2 has an item, otherwise AGV will wait forever at L2
    graph = SiteGraph()
    l1 = Location(0, 0)
    l2 = StoreLocation(env, 10, 0, initial_items=["TestBox"]) # Has item!
    l3 = StoreLocation(env, 20, 0)
    
    graph.add_node(l1)
    graph.add_node(l2)
    graph.add_node(l3)
    graph.add_edge(l1, l2)
    graph.add_edge(l2, l3)
    
    # Create Task
    task = AGVTask(source=l2, sink=l3)
    task_provider = DeterministicTaskProvider([task])

    # Setup Fleet Manager
    fleet_manager = FleetManager(task_provider, graph)
    env.add_child(fleet_manager)

    # Setup AGV at L1
    agv = AGV(l1, speed=1.0)
    fleet_manager.add_child(agv)

    # Start the Fleet Manager process
    env.process(fleet_manager.plan_indefinitely(env))

    # Run simulation until right before pickup
    env.run(until=9)
    assert not agv.is_available()
    assert agv.planned_destination == l3
    assert l2.store.items == ["TestBox"]
    assert l3.store.items == []

    # Run until right before drop-off
    env.run(until=19)
    assert not agv.is_available()
    assert agv.planned_destination == l3
    assert l2.store.items == []
    assert l3.store.items == []

    # Run simulation until after drop-off
    env.run(until=21)
    assert agv.is_available()
    assert l2.store.items == []
    assert l3.store.items == ["TestBox"]

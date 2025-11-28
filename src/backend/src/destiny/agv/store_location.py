from typing import Generic, TypeVar, List
import simpy

from destiny.agv.location import Location
from destiny.core.simulation_container import SimulationContainer
from destiny.core.environment import TickingEnvironment
from destiny.core.snapshot import ComponentSnapshot

T = TypeVar("T")


class StoreLocation(Location, SimulationContainer, Generic[T]):
    """
    A generic store location that acts as a buffer (source, sink, or storage).
    Inherits from Location for positioning and SimulationContainer for simulation lifecycle.
    """
    def __init__(self, env: TickingEnvironment, x: float, y: float, capacity: float = float('inf'), initial_items: List[T] = None):
        Location.__init__(self, x, y)
        SimulationContainer.__init__(self)
        env.add_child(self)
        
        self.store = simpy.Store(env, capacity=capacity)
        
        if initial_items:
            self.store.items.extend(initial_items)

    def _get_snapshot_state(self, t: float) -> ComponentSnapshot | None:
        # todo: implement snapshot
        # If we wanted to render items in the store, we would sync _children here:
        # self._children = [item for item in self.store.items if isinstance(item, SimulationContainer)]
        return None

    def get_item(self) -> simpy.events.Event:
        """Request an item from the store location."""
        return self.store.get()

    def put_item(self, item: T) -> simpy.events.Event:
        """Put an item into the store location."""
        return self.store.put(item)

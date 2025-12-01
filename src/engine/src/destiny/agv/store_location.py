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
            
    def get_item(self) -> simpy.events.Event:
        """Request an item from the store location."""
        return self.store.get()

    def put_item(self, item: T) -> simpy.events.Event:
        """Put an item into the store location."""
        return self.store.put(item)

    @property
    def snapshot_type(self) -> str:
        return "store"

    def _get_snapshot_state(self, t: float) -> ComponentSnapshot | None:
        return ComponentSnapshot(
            type=self.snapshot_type,
            x=self.x,
            y=self.y,
            angle=0.0,
            id=self.id
        )

class Source(StoreLocation[T]):
    @property
    def snapshot_type(self) -> str:
        return "source"

class Sink(StoreLocation[T]):
    @property
    def snapshot_type(self) -> str:
        return "sink"

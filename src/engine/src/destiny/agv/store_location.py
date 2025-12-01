"""
Store locations: Sources, Sinks, and generic storage buffers.
"""
from typing import Generic, TypeVar, List
import simpy

from destiny.agv.location import Location
from destiny.core.simulation_container import SimulationEntity
from destiny.core.environment import Environment

T = TypeVar("T")


class StoreLocation(Location, SimulationEntity, Generic[T]):
    """
    A store location that acts as a buffer (source, sink, or storage).
    
    Records a static motion segment (position doesn't change).
    """
    
    def __init__(
        self,
        env: Environment,
        x: float,
        y: float,
        capacity: float = float('inf'),
        initial_items: List[T] | None = None
    ):
        Location.__init__(self, x, y)
        SimulationEntity.__init__(self)
        
        self.store = simpy.Store(env, capacity=capacity)
        
        if initial_items:
            self.store.items.extend(initial_items)
        
        # Record static position (same start/end = not moving)
        env.record_motion(
            entity=self,
            start_time=env.now,
            end_time=None,  # Until simulation end
            start_x=x,
            start_y=y,
            end_x=x,
            end_y=y,
        )

    def _get_entity_type(self) -> str:
        return "store"

    def get_item(self) -> simpy.events.Event:
        """Request an item from the store location."""
        return self.store.get()

    def put_item(self, item: T) -> simpy.events.Event:
        """Put an item into the store location."""
        return self.store.put(item)


class Source(StoreLocation[T]):
    """A store location that provides items."""
    
    def _get_entity_type(self) -> str:
        return "source"


class Sink(StoreLocation[T]):
    """A store location that receives items."""
    
    def _get_entity_type(self) -> str:
        return "sink"

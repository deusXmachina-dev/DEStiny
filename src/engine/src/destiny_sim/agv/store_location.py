"""
Store locations: Sources, Sinks, and generic storage buffers.
"""

from typing import Generic, List, TypeVar

import simpy

from destiny_sim.agv.location import Location
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity

T = TypeVar("T")


class StoreLocation(Location, SimulationEntity, Generic[T]):
    """
    A store location that acts as a buffer (source, sink, or storage).

    Records a static motion segment (position doesn't change).
    """

    def __init__(
        self,
        env: RecordingEnvironment,
        x: float,
        y: float,
        capacity: float = float("inf"),
        initial_items: List[T] | None = None,
    ):
        Location.__init__(self, x, y)
        SimulationEntity.__init__(self)

        self.store = simpy.Store(env, capacity=capacity)

        if initial_items:
            self.store.items.extend(initial_items)

        # Record static position (same start/end = not moving)
        env.record_stay(entity=self, x=x, y=y)

    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.PALETTE)

    def get_item(self) -> simpy.events.Event:
        """Request an item from the store location."""
        return self.store.get()

    def put_item(self, item: T) -> simpy.events.Event:
        """Put an item into the store location."""
        return self.store.put(item)


class Source(StoreLocation[T]):
    """A store location that provides items."""

    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.PALETTE)


class Sink(StoreLocation[T]):
    """A store location that receives items."""

    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.PALETTE)

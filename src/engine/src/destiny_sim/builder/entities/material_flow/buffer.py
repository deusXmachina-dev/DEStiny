"""
Buffer entity for simulation.
"""

from typing import Any

import simpy

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType

BUFFER_NUMBER_OF_ITEMS_METRIC = "Number of items in buffer"

class Buffer(BuilderEntity):
    """
    A simple buffer entity that stores items.
    """
    
    entity_type = "buffer"
    icon = "/assets/palette.png"

    def __init__(
        self,
        x: float, 
        y: float, 
        capacity: float,
    ):
        super().__init__()
        self.x = x
        self.y = y
        self.capacity = capacity
        
        self._store: simpy.Store | None = None

    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.PALETTE)
    
    def get_item(self, env: RecordingEnvironment) -> simpy.events.Event:
        """Request an item from the buffer."""
        event = self._get_store(env).get()
        
        def _decrement_buffer_gauge(event):
            env.adjust_gauge(BUFFER_NUMBER_OF_ITEMS_METRIC, -1)
        
        event.callbacks.append(_decrement_buffer_gauge)
        return event

    def put_item(self, env: RecordingEnvironment, item: Any) -> simpy.events.Event:
        """Put an item into the buffer."""
        event = self._get_store(env).put(item)

        def _increment_buffer_gauge(event):
            env.adjust_gauge(BUFFER_NUMBER_OF_ITEMS_METRIC, 1)
        
        event.callbacks.append(_increment_buffer_gauge)
        return event

    def _create_store(self, env: RecordingEnvironment):
        self._store = simpy.Store(env, capacity=self.capacity)
    
    def _get_store(self, env: RecordingEnvironment) -> simpy.Store:
        if self._store is None:
            self._create_store(env)
        return self._store

"""
Buffer entity for simulation.
"""

from typing import Any

import simpy

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import SimulationEntityType

BUFFER_NUMBER_OF_ITEMS_METRIC = "Number of items in buffer"

class Buffer(BuilderEntity):
    """
    A simple buffer entity that stores items.
    """
    
    entity_type = SimulationEntityType.BUFFER

    def __init__(
        self,
        name: str,
        x: float, 
        y: float, 
        capacity: float,
    ):
        super().__init__(name=name)
        self.x = x
        self.y = y
        self.capacity = capacity
        
        self._store: simpy.Store | None = None
        
    def process(self, env: RecordingEnvironment):
        yield env.record_stay(self, x=self.x, y=self.y)
    
    def get_item(self, env: RecordingEnvironment) -> simpy.events.Event:
        """Request an item from the buffer."""
        event = self._get_store(env).get()
        
        def _decrement_buffer_gauge(event):
            env.adjust_gauge(f"{BUFFER_NUMBER_OF_ITEMS_METRIC} {self.name}", -1)
        
        event.callbacks.append(_decrement_buffer_gauge)
        return event

    def put_item(self, env: RecordingEnvironment, item: Any) -> simpy.events.Event:
        """Put an item into the buffer."""
        event = self._get_store(env).put(item)

        def _increment_buffer_gauge(event):
            env.adjust_gauge(f"{BUFFER_NUMBER_OF_ITEMS_METRIC} {self.name}", 1)
        
        event.callbacks.append(_increment_buffer_gauge)
        return event

    def _create_store(self, env: RecordingEnvironment):
        self._store = simpy.Store(env, capacity=self.capacity)
    
    def _get_store(self, env: RecordingEnvironment) -> simpy.Store:
        if self._store is None:
            self._create_store(env)
        return self._store

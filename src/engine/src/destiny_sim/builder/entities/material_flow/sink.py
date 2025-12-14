"""
Sink entity for simulation.
"""

from typing import Any

import simpy

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import SimulationEntityType

SINK_ITEM_DELIVERED_METRIC = "Items delivered to sink"

class Sink(BuilderEntity):
    """
    A simple sink entity that consumes items.
    """
    
    entity_type = SimulationEntityType.SINK

    def __init__(
        self,
        name: str,
        x: float, 
        y: float, 
    ):
        super().__init__(name=name)
        self.x = x
        self.y = y
        self.items_delivered = 0
        
    def process(self, env: RecordingEnvironment):
        yield env.record_stay(self, x=self.x, y=self.y)

    def put_item(self, env: RecordingEnvironment, item: Any) -> simpy.events.Event:
        """Put an item into the sink."""
        self.items_delivered += 1
        env.incr_counter(f"{SINK_ITEM_DELIVERED_METRIC} {self.name}")
        return env.timeout(0)

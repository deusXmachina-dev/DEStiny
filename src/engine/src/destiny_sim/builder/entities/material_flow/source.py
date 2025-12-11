"""
Source entity for simulation.
"""

import simpy

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType


SOURCE_ITEM_PRODUCED_METRIC = "Items produced by source"

class Source(BuilderEntity):
    """
    A simple source entity that produces items.
    """
    
    entity_type = SimulationEntityType.SOURCE

    def __init__(
        self,
        x: float, 
        y: float, 
    ):
        super().__init__()
        self.x = x
        self.y = y
        
    def process(self, env: RecordingEnvironment):
        yield env.record_stay(self, x=self.x, y=self.y)

    def get_item(self, env: RecordingEnvironment) -> simpy.events.Event:
        """Request an item from the source."""
        event = env.event()
        event.succeed("foo")  # todo: add some actual item
        env.incr_counter(SOURCE_ITEM_PRODUCED_METRIC)
        return event

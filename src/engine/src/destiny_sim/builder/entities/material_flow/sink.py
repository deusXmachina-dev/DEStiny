"""
Sink entity for simulation.
"""

from typing import Any

import simpy

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType


SINK_ITEM_DELIVERED_METRIC = "Items delivered to sink"

class Sink(BuilderEntity):
    """
    A simple sink entity that consumes items.
    """
    
    entity_type = "sink"
    icon = "/assets/palette.png"

    def __init__(
        self,
        x: float, 
        y: float, 
    ):
        super().__init__()
        self.x = x
        self.y = y

    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.PALETTE)

    def put_item(self, env: RecordingEnvironment, item: Any) -> simpy.events.Event:
        """Put an item into the sink."""
        env.incr_counter(SINK_ITEM_DELIVERED_METRIC)
        return env.timeout(0)

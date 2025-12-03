"""
Items that can be transported by AGVs.
"""

from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity


class Box(SimulationEntity):
    """
    A box that can be picked up and transported by an AGV.

    Motion is recorded by the manipulating entity when it carries/drops the box.
    """

    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.BOX)

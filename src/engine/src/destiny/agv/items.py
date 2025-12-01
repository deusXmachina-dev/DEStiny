"""
Items that can be transported by AGVs.
"""
from destiny.core.simulation_container import SimulationEntity


class Box(SimulationEntity):
    """
    A box that can be picked up and transported by an AGV.
    
    Motion is recorded by the manipulating entity when it carries/drops the box.
    """
    
    def _get_entity_type(self) -> str:
        return "box"

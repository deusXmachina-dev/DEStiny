"""
Items that can be transported by AGVs.
"""
from destiny.core.simulation_entity import SimulationEntity
from destiny.core.rendering import RenderingInfo, AssetType


class Box(SimulationEntity):
    """
    A box that can be picked up and transported by an AGV.
    
    Motion is recorded by the manipulating entity when it carries/drops the box.
    """
    
    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(asset_type=AssetType.BOX)

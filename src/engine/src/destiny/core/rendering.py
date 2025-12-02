"""
Rendering information for simulation entities.
"""
from enum import StrEnum


class AssetType(StrEnum):
    """Asset types for rendering entities in the frontend."""
    AGV = "agv"
    BOX = "box"
    STORE = "store"
    SOURCE = "source"
    SINK = "sink"
    GRID_NODE = "grid_node"
    EMPTY = ""


class RenderingInfo:
    """
    Rendering information for a simulation entity.
    
    Contains information needed to render the entity in the frontend.
    """
    
    def __init__(self, asset_type: AssetType = AssetType.EMPTY):
        """
        Initialize rendering info.
        
        Args:
            asset_type: The type of asset to use for rendering this entity.
        """
        self.asset_type: AssetType = asset_type


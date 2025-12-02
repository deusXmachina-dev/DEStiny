"""
Rendering information for simulation entities.
"""
from enum import StrEnum


class SimulationEntityType(StrEnum):
    """Simulation entity types for rendering entities in the frontend."""
    AGV = "agv"
    ROBOT = "robot"
    BOX = "box"
    PALETTE = "palette"
    HUMAN = "human"
    COUNTER = "counter"
    GRID_NODE = "grid_node"
    EMPTY = ""


class RenderingInfo:
    """
    Rendering information for a simulation entity.
    
    Contains information needed to render the entity in the frontend.
    """
    
    def __init__(self, entity_type: SimulationEntityType = SimulationEntityType.EMPTY):
        """
        Initialize rendering info.
        
        Args:
            entity_type: The type of entity to use for rendering this entity.
        """
        self.entity_type: SimulationEntityType = entity_type


"""
Rendering information for simulation entities.
"""

from enum import StrEnum
from typing import Optional


class SimulationEntityType(StrEnum):
    """Simulation entity types for rendering entities in the frontend."""

    AGV = "agv"
    ROBOT = "robot"
    BOX = "box"
    PALETTE = "palette"
    SOURCE = "source"
    SINK = "sink"
    BUFFER = "buffer"
    HUMAN = "human"
    COUNTER = "counter"
    GRID_NODE = "grid_node"
    MANUFACTURING_CELL = "manufacturing_cell"
    CONTROL = "control"
    EMPTY = ""


class RenderingInfo:
    """
    Rendering information for a simulation entity.

    Contains information needed to render the entity in the frontend.
    """

    def __init__(
        self,
        entity_type: SimulationEntityType = SimulationEntityType.EMPTY,
        name: Optional[str] = None,
    ):
        """
        Initialize rendering info.

        Args:
            entity_type: The type of entity to use for rendering this entity.
            name: Optional name of the entity for display purposes.
        """
        self.entity_type: SimulationEntityType = entity_type
        self.name: Optional[str] = name

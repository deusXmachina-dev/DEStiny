"""
Base class for simulation entities.

Provides ID and information about the entity for rendering.
"""
from abc import ABC
import uuid

from destiny.core.rendering import RenderingInfo, SimulationEntityType


class SimulationEntity(ABC):
    """
    Base class for any entity that can appear in the simulation.
    
    Provides:
    - Unique ID
    - Rendering information (for frontend display)
    
    Rendering information is used for displaying entities in the frontend.
    """

    def __init__(self):
        self.id: str = str(uuid.uuid4())

    def get_rendering_info(self) -> RenderingInfo:
        """
        Return rendering information for this entity.
        
        By default, returns empty rendering info. Subclasses should override
        this method to provide appropriate rendering information.
        
        Returns:
            RenderingInfo instance with asset type and other rendering properties.
        """
        return RenderingInfo(entity_type=SimulationEntityType.EMPTY)

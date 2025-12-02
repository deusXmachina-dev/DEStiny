"""
Base class for simulation entities.

Provides ID and information about the entity for rendering.
"""
from abc import abstractmethod, ABC
import uuid


class SimulationEntity(ABC):
    """
    Base class for any entity that can appear in the simulation.
    
    Provides:
    - Unique ID
    - Entity type (for rendering)
    
    Entity types are used for rendering.
    """

    def __init__(self):
        self.id: str = str(uuid.uuid4())

    @abstractmethod
    def _get_entity_type(self) -> str:
        """
        Return the type identifier for this entity (e.g., 'agv', 'box', 'source').
        Used for rendering on the frontend.
        """
        pass

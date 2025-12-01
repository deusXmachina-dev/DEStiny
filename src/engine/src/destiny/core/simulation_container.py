"""
Base class for simulation entities.

Simplified to just provide identity (id + type).
All motion recording goes through the environment.
"""
from abc import abstractmethod, ABC
import uuid


class SimulationEntity(ABC):
    """
    Base class for any entity that can appear in the simulation.
    
    Provides:
    - Unique ID
    - Entity type (for rendering)
    
    Motion recording is handled by the environment, not the entity itself.
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

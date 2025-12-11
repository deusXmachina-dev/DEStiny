"""
Base classes for builder entities.
"""

import inspect
from typing import Dict, Any

from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity


class BuilderEntity(SimulationEntity):
    """
    Base class for entities that can be instantiated from the builder blueprint.
    """

    # The unique type identifier matching the frontend entityType
    entity_type: SimulationEntityType = SimulationEntityType.EMPTY

    def __init__(self, **kwargs):
        super().__init__()
        
    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(self.entity_type)

    def process(self, env: RecordingEnvironment):
        """
        The main process for this entity.
        This will be started as a SimPy process when the simulation begins.
        """
        pass

    @classmethod
    def get_parameters_schema(cls) -> Dict[str, Any]:
        """
        Extract parameter schema from __init__ arguments.
        Returns a dictionary representing the entity schema for the frontend:
        {
            "entityType": str,
            "icon": SimulationEntityType,
            "parameters": { param_name: type_name }
        }
        """
        sig = inspect.signature(cls.__init__)
        params = {}
        for name, param in sig.parameters.items():
            if name in ("self", "env", "args", "kwargs"):
                continue

            # Map Python types to frontend schema types
            type_name = "any"
            if param.annotation == int or param.annotation == float:
                type_name = "number"
            elif param.annotation == str:
                type_name = "string"
            elif param.annotation == bool:
                type_name = "boolean"

            params[name] = type_name

        return {
            "entityType": cls.entity_type,
            "parameters": params
        }

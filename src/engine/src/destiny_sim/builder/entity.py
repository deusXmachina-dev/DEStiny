"""
Base classes for builder entities.
"""

import inspect
from typing import Dict

from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.simulation_entity import SimulationEntity


class BuilderEntity(SimulationEntity):
    """
    Base class for entities that can be instantiated from the builder blueprint.
    """

    # The unique type identifier matching the frontend entityType
    entity_type: str = ""

    def __init__(self, env: RecordingEnvironment, **kwargs):
        super().__init__()
        # kwargs are passed to match the signature of the concrete class's __init__
        # This base init doesn't do much with them, but subclasses might use them.
        pass

    def process(self, env: RecordingEnvironment):
        """
        The main process for this entity.
        This will be started as a SimPy process when the simulation begins.
        """
        pass

    @classmethod
    def get_parameters_schema(cls) -> Dict[str, str]:
        """
        Extract parameter schema from __init__ arguments.
        Returns a dictionary of param_name -> type_name.
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

        return params

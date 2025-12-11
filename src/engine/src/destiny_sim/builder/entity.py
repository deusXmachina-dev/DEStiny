"""
Base classes for builder entities.
"""

import inspect

from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity
from destiny_sim.builder.schema import BuilderEntitySchema, ParameterType


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
    def get_parameters_schema(cls) -> BuilderEntitySchema:
        """
        Extract parameter schema from __init__ arguments.
        Returns a BuilderEntitySchema representing the entity schema for the frontend.
        """
        sig = inspect.signature(cls.__init__)
        params = {}
        for name, param in sig.parameters.items():
            if name in ("self", "env", "args", "kwargs"):
                continue

            # Map Python types to ParameterType enum
            param_type = ParameterType.STRING  # default
            if param.annotation == int or param.annotation == float:
                param_type = ParameterType.NUMBER
            elif param.annotation == str:
                param_type = ParameterType.STRING
            elif param.annotation == bool:
                param_type = ParameterType.BOOLEAN

            params[name] = param_type

        return BuilderEntitySchema(
            entityType=cls.entity_type,
            parameters=params
        )

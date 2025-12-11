"""
Base classes for builder entities.
"""

import inspect
from typing import get_args

from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity
from destiny_sim.builder.schema import BuilderEntitySchema, ParameterInfo, ParameterType


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
        """Extract parameter schema from __init__ arguments."""
        sig = inspect.signature(cls.__init__)
        params = {}
        for name, param in sig.parameters.items():
            if name in ("self", "env", "args", "kwargs"):
                continue

            annotation = param.annotation
            param_type = ParameterType.STRING
            allowed_entity_types = None

            if annotation == inspect.Parameter.empty:
                pass  # Already defaulted to STRING
            elif annotation == int or annotation == float:
                param_type = ParameterType.NUMBER
            elif annotation == str:
                param_type = ParameterType.STRING
            elif annotation == bool:
                param_type = ParameterType.BOOLEAN
            else:
                # Check if it's an entity parameter
                entity_info = _extract_entity_info(annotation)
                if entity_info is not None:
                    param_type, allowed_entity_types = entity_info

            params[name] = ParameterInfo(
                name=name,
                type=param_type,
                allowedEntityTypes=allowed_entity_types,
            )

        return BuilderEntitySchema(
            entityType=cls.entity_type,
            parameters=params
        )


def _extract_entity_info(annotation) -> tuple[ParameterType, list[SimulationEntityType] | None] | None:
    """Extract entity parameter info from type annotation. Returns None if not an entity."""
    # Check if annotation is BuilderEntity or a subclass
    if isinstance(annotation, type) and issubclass(annotation, BuilderEntity):
        if annotation != BuilderEntity:
            entity_type = getattr(annotation, "entity_type", None)
            if entity_type is not None:
                return ParameterType.ENTITY, [entity_type]
        else:
            raise ValueError(f"Annotation {annotation} is not a subclass of BuilderEntity")
    
    # Handle typing annotations like Optional[BuilderEntity] or Union types
    if hasattr(annotation, "__origin__"):
        entity_types = []
        for arg in get_args(annotation):
            if isinstance(arg, type) and issubclass(arg, BuilderEntity):
                if arg == BuilderEntity:
                    # If base BuilderEntity is in union, allow all types
                    return ParameterType.ENTITY, None
                entity_type = getattr(arg, "entity_type", None)
                if entity_type is not None:
                    entity_types.append(entity_type)
        
        if entity_types:
            return ParameterType.ENTITY, entity_types
    
    return None

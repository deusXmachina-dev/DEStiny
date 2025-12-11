"""
Blueprint runner - executes simulations from blueprint definitions.
"""

from typing import Any, Dict, Type

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.builder.entities import Human
from destiny_sim.builder.entities.material_flow.buffer import Buffer
from destiny_sim.builder.entities.material_flow.manufacturing_cell import ManufacturingCell
from destiny_sim.builder.entities.material_flow.sink import Sink
from destiny_sim.builder.entities.material_flow.source import Source
from destiny_sim.builder.schema import Blueprint, BlueprintEntity, BlueprintParameterType
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import SimulationEntityType
from destiny_sim.core.timeline import SimulationRecording


# Registry of available builder entities by their entity_type
_ENTITY_REGISTRY: Dict[SimulationEntityType, Type[BuilderEntity]] = {
    Human.entity_type: Human,
    Source.entity_type: Source,
    Sink.entity_type: Sink,
    Buffer.entity_type: Buffer,
    ManufacturingCell.entity_type: ManufacturingCell,
}


def register_entity(entity_class: Type[BuilderEntity]) -> None:
    """
    Register a builder entity class in the registry.
    
    Args:
        entity_class: A BuilderEntity subclass to register
    """
    if not issubclass(entity_class, BuilderEntity):
        raise TypeError(f"{entity_class} must be a subclass of BuilderEntity")
    
    entity_type = getattr(entity_class, "entity_type", None)
    if not entity_type:
        raise ValueError(f"{entity_class} must have an entity_type class attribute")
    
    _ENTITY_REGISTRY[entity_type] = entity_class


def get_registered_entities() -> Dict[str, Type[BuilderEntity]]:
    """
    Get a copy of the entity registry.
    
    Returns:
        Dictionary mapping entity_type strings to BuilderEntity classes
    """
    return _ENTITY_REGISTRY.copy()


def run_blueprint(
    blueprint: Blueprint,
) -> SimulationRecording:
    """
    Run a simulation from a blueprint definition.
    
    Args:
        blueprint: Blueprint object defining the simulation
    
    Returns:
        SimulationRecording containing all motion segments and metrics
    
    Raises:
        KeyError: If entity_type is not registered
        ValueError: If there's a cycle or missing dependencies
        TypeError: If entity instantiation fails
    """
    # Extract simulation parameters
    sim_params = blueprint.simParams
    # Handle None values explicitly - when schema validation includes None,
    # we want to use defaults instead
    initial_time = sim_params.initialTime if sim_params.initialTime is not None else 0.0
    duration = sim_params.duration
    
    # Create environment
    env = RecordingEnvironment(initial_time=initial_time)
    
    # Instantiate entities and start their processes
    _instantiate_entities(blueprint, env)
    
    # Determine simulation end time
    if duration is not None:
        run_until = initial_time + duration
        env.run(until=run_until)
    else:
        # Run until all processes complete
        env.run()
    
    # Return recording
    return env.get_recording()


def _instantiate_entities(
    blueprint: Blueprint, env: RecordingEnvironment
) -> Dict[str, BuilderEntity]:
    """
    Instantiate all entities from blueprint with dependency resolution.
    
    Args:
        blueprint: Blueprint containing entities to instantiate
        env: RecordingEnvironment for the simulation
    
    Returns:
        Dictionary mapping UUID to BuilderEntity instances
    
    Raises:
        KeyError: If entity_type is not registered or entity reference is invalid
        ValueError: If there's a cycle or missing dependencies
        TypeError: If entity instantiation fails
    """
    all_uuids = {e.uuid for e in blueprint.entities}
    uuid_to_entity: Dict[str, BuilderEntity] = {}
    remaining: list[BlueprintEntity] = list(blueprint.entities)
    skipped_count = 0
    
    while remaining:
        entity = remaining.pop(0)
        entity_type = entity.entityType
        
        # Look up entity class in registry
        entity_class = _ENTITY_REGISTRY.get(entity_type)
        if entity_class is None:
            raise KeyError(
                f"Unknown entity_type '{entity_type}'. "
                f"Available types: {list(_ENTITY_REGISTRY.keys())}"
            )

        resolved_params, can_resolve = _resolve_entity_parameters(
            entity, all_uuids, uuid_to_entity
        )
        
        if can_resolve:
            # All parameters resolved - instantiate entity
            try:
                entity_instance = entity_class(**resolved_params)
            except Exception as e:
                raise TypeError(
                    f"Failed to instantiate {entity_type} (uuid: {entity.uuid}) "
                    f"with parameters {resolved_params}: {e}"
                ) from e
            
            uuid_to_entity[entity.uuid] = entity_instance
            skipped_count = 0
        else:
            # Can't resolve yet - append back to end
            remaining.append(entity)
            skipped_count += 1
        
        # Check for cycle or missing dependencies (only when remaining is not empty)
        if remaining and skipped_count >= len(remaining):
            raise ValueError(f"Circular dependency or missing entity references detected.")
    
    # Start all entity processes
    for entity_instance in uuid_to_entity.values():
        env.process(entity_instance.process(env))
    
    return uuid_to_entity


def _resolve_entity_parameters(
            entity: BlueprintEntity,
            all_uuids: set[str],
            uuid_to_entity: Dict[str, Any],
        ) -> tuple[Dict[str, Any], bool]:
            """
            Try to resolve the parameters of an entity from blueprint.

            Returns (resolved_params, can_resolve). If can_resolve is False,
            not all entity dependencies are yet available.
            """
            resolved_params: Dict[str, Any] = {}
            can_resolve = True

            for param_name, param in entity.parameters.items():
                if param.parameterType == BlueprintParameterType.PRIMITIVE:
                    resolved_params[param_name] = param.value
                elif param.parameterType == BlueprintParameterType.ENTITY:
                    # Entity parameter - value should be a UUID string
                    referenced_uuid = param.value
                    if not isinstance(referenced_uuid, str):
                        raise ValueError(
                            f"Entity parameter '{param_name}' must have string UUID value, "
                            f"got {type(referenced_uuid).__name__}"
                        )

                    # Validate UUID exists in blueprint
                    if referenced_uuid not in all_uuids:
                        raise ValueError(
                            f"Entity reference '{referenced_uuid}' in parameter '{param_name}' "
                            f"does not exist in blueprint"
                        )

                    # Check if referenced entity is already instantiated
                    if referenced_uuid not in uuid_to_entity:
                        # Can't resolve yet - append back and break
                        can_resolve = False
                        break

                    # Resolve to actual entity instance
                    resolved_params[param_name] = uuid_to_entity[referenced_uuid]
            return resolved_params, can_resolve

"""
Blueprint runner - executes simulations from blueprint definitions.
"""

from typing import Dict, Type

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.builder.entities import Human
from destiny_sim.builder.entities.material_flow.buffer import Buffer
from destiny_sim.builder.entities.material_flow.sink import Sink
from destiny_sim.builder.entities.material_flow.source import Source
from destiny_sim.builder.schema import Blueprint
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import SimulationEntityType
from destiny_sim.core.timeline import SimulationRecording


# Registry of available builder entities by their entity_type
_ENTITY_REGISTRY: Dict[SimulationEntityType, Type[BuilderEntity]] = {
    Human.entity_type: Human,
    Source.entity_type: Source,
    Sink.entity_type: Sink,
    Buffer.entity_type: Buffer,
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
    for entity_data in blueprint.entities:
        entity_type = entity_data.entityType
        
        # Look up entity class in registry
        entity_class = _ENTITY_REGISTRY.get(entity_type)
        if entity_class is None:
            raise KeyError(
                f"Unknown entity_type '{entity_type}'. "
                f"Available types: {list(_ENTITY_REGISTRY.keys())}"
            )
        
        # Extract parameters
        parameters = entity_data.parameters
        
        # Instantiate entity
        try:
            entity = entity_class(**parameters)
        except Exception as e:
            raise TypeError(
                f"Failed to instantiate {entity_type} with parameters {parameters}: {e}"
            ) from e
        
        # Start the entity's process
        env.process(entity.process(env))
    
    # Determine simulation end time
    if duration is not None:
        run_until = initial_time + duration
        env.run(until=run_until)
    else:
        # Run until all processes complete
        env.run()
    
    # Return recording
    return env.get_recording()

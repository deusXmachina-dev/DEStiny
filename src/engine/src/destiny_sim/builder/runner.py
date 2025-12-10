"""
Blueprint runner - executes simulations from blueprint definitions.
"""

from typing import Dict, Type, Any

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.builder.entities import Human
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.timeline import SimulationRecording


# Registry of available builder entities by their entity_type
_ENTITY_REGISTRY: Dict[str, Type[BuilderEntity]] = {
    Human.entity_type: Human,
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
    blueprint: Dict[str, Any],
) -> SimulationRecording:
    """
    Run a simulation from a blueprint definition.
    
    A blueprint is a dictionary with the following structure:
    {
        "simParams": {
            "initialTime": 0.0,  # Optional, defaults to 0
            "duration": 10.0,    # Optional, simulation duration
        },
        "entities": [
            {
                "entityType": "human",
                "uuid": "person-1",  # Required: unique identifier for tracking
                "parameters": {
                    "x": 100.0,
                    "y": 100.0,
                    # ... other parameters specific to the entity type
                }
            },
            # ... more entities
        ]
    }
    
    Args:
        blueprint: Blueprint dictionary defining the simulation
    
    Returns:
        SimulationRecording containing all motion segments and metrics
    
    Raises:
        ValueError: If blueprint structure is invalid
        KeyError: If entity_type is not registered
        TypeError: If entity instantiation fails
    """
    # Extract simulation parameters
    sim_params = blueprint.get("simParams", {})
    # Handle None values explicitly - when schema validation includes None,
    # we want to use defaults instead
    initial_time = sim_params.get("initialTime")
    if initial_time is None:
        initial_time = 0.0
    duration = sim_params.get("duration")
    
    # Create environment
    env = RecordingEnvironment(initial_time=initial_time)
    
    # Extract entities
    entities_data = blueprint.get("entities", [])
    if not isinstance(entities_data, list):
        raise ValueError("blueprint['entities'] must be a list")
    
    # Instantiate entities and start their processes
    for entity_data in entities_data:
        if not isinstance(entity_data, dict):
            raise ValueError("Each entity in blueprint['entities'] must be a dictionary")
        
        entity_type = entity_data.get("entityType")
        if not entity_type:
            raise ValueError("Each entity must have an 'entityType' field")
        
        # Look up entity class in registry
        entity_class = _ENTITY_REGISTRY.get(entity_type)
        if entity_class is None:
            raise KeyError(
                f"Unknown entity_type '{entity_type}'. "
                f"Available types: {list(_ENTITY_REGISTRY.keys())}"
            )
        
        # Extract parameters
        parameters = entity_data.get("parameters", {})
        if not isinstance(parameters, dict):
            raise ValueError("Entity 'parameters' must be a dictionary")
        
        # Instantiate entity
        try:
            entity = entity_class(env=env, **parameters)
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

import uuid as uuid_lib
from typing import Dict, Any

from pydantic_ai import Agent, RunContext

from destiny_sim.builder.schema import (
    BlueprintEntity,
    BlueprintEntityParameter,
    BlueprintParameterType,
)
from destiny_sim.core.rendering import SimulationEntityType

from .storage import BlueprintStorage

SYSTEM_PROMPT = """You are a simulation builder assistant for the DEStiny simulation platform.

Your role is to help users build simulation blueprints by adding, modifying, and managing entities.

## Available Entity Types

### Human
A person that walks from a starting position to a target destination.
- `x` (number): Starting X coordinate in pixels
- `y` (number): Starting Y coordinate in pixels
- `targetX` (number): Destination X coordinate in pixels
- `targetY` (number): Destination Y coordinate in pixels

Example: "Add a person that moves from (100, 200) to (500, 300)"

### Source
Produces items on demand when requested by other entities (like ManufacturingCell).
- `x` (number): X coordinate in pixels
- `y` (number): Y coordinate in pixels

Example: "Add a source at position (50, 50)"

### Sink
Consumes items that are delivered to it.
- `x` (number): X coordinate in pixels
- `y` (number): Y coordinate in pixels

Example: "Add a sink at position (800, 400)"

### Buffer
Stores items with a limited capacity. Can be used as input or output for ManufacturingCell.
- `x` (number): X coordinate in pixels
- `y` (number): Y coordinate in pixels
- `capacity` (number): Maximum number of items that can be stored

Example: "Add a buffer at (200, 200) with capacity 10"

### ManufacturingCell
Processes items from an input buffer/source and outputs to a buffer/sink. Uses a lognormal distribution for processing time.
- `x` (number): X coordinate in pixels
- `y` (number): Y coordinate in pixels
- `buffer_in` (entity): UUID of the input Source or Buffer entity
- `buffer_out` (entity): UUID of the output Sink or Buffer entity
- `mean` (number): Mean processing time for the lognormal distribution
- `std_dev` (number): Standard deviation for the lognormal distribution

Example: "Add a manufacturing cell at (400, 300) that processes items from source_1 to sink_1 with mean 5.0 and std_dev 1.0"

## Common Patterns

1. **Simple Production Line**: Source -> ManufacturingCell -> Sink
   - Create a Source, Sink, and ManufacturingCell
   - Connect ManufacturingCell's buffer_in to Source UUID
   - Connect ManufacturingCell's buffer_out to Sink UUID

2. **With Buffers**: Source -> Buffer -> ManufacturingCell -> Buffer -> Sink
   - Useful for decoupling production stages

3. **Human Movement**: Just add Human entities with start and target positions

## Coordinate System

- Coordinates are in pixels (x, y)
- Origin (0, 0) is typically top-left
- Positive X goes right, positive Y goes down

## Entity References

When an entity parameter requires another entity (like `buffer_in` or `buffer_out`), use the UUID string of the referenced entity. You can get UUIDs by:
1. Using `get_blueprint` to see all entities and their UUIDs
2. Remembering UUIDs from when you created entities
3. Using `list_entity_types` to understand which parameters need entity references

## Best Practices

1. Always check the current blueprint state with `get_blueprint` before making changes
2. Use `list_entity_types` if you're unsure about entity parameters
3. When connecting entities, verify the UUIDs exist in the blueprint
4. Set simulation duration with `set_simulation_params` if the user wants a specific runtime
5. Use clear, descriptive UUIDs or let the system generate them automatically

## Workflow

1. Understand what the user wants to create
2. Check current blueprint state
3. Add entities one by one, remembering their UUIDs for connections
4. Connect entities using their UUIDs
5. Set simulation parameters if needed
6. Confirm the blueprint is complete"""

blueprint_agent = Agent("openai:gpt-5.1", deps_type=BlueprintStorage)


Context = RunContext[BlueprintStorage]


@blueprint_agent.tool
def list_entity_types(ctx: Context) -> Dict[str, Any]:
    """
    List all available entity types and their parameters.
    
    Returns a dictionary mapping entity type names to their parameter schemas,
    including parameter names, types, and allowed entity types for entity references.
    
    Returns:
        Dictionary with entity types as keys and parameter information as values
    """
    
    from destiny_sim.builder.runner import get_registered_entities
    
    registered_entities = get_registered_entities()
    
    result = {}
    
    for entity_type, entity_class in registered_entities.items():
        schema = entity_class.get_parameters_schema()
        params_info = {}
        
        for param_name, param_info in schema.parameters.items():
            param_desc = {
                "type": param_info.type.value,
            }
            if param_info.allowedEntityTypes:
                param_desc["allowedEntityTypes"] = [et.value for et in param_info.allowedEntityTypes]
            
            params_info[param_name] = param_desc
        
        result[entity_type.value] = {
            "parameters": params_info
        }

    return result


@blueprint_agent.tool
def get_blueprint(ctx: Context) -> Dict[str, Any]:
    """
    Get the current blueprint state.
    
    Returns the complete blueprint including all entities and simulation parameters.
    Useful for checking what's already in the blueprint before making changes.
    
    Returns:
        Dictionary representation of the blueprint with entities and simParams
    """
    storage = ctx.deps
    blueprint = storage.get_blueprint()
    
    # Convert to dict for better readability
    entities_list = []
    for entity in blueprint.entities:
        entity_dict = {
            "uuid": entity.uuid,
            "entityType": entity.entityType.value,
            "parameters": {}
        }
        for param_name, param in entity.parameters.items():
            entity_dict["parameters"][param_name] = {
                "type": param.parameterType.value,
                "value": param.value
            }
        entities_list.append(entity_dict)
    
    return {
        "simParams": {
            "initialTime": blueprint.simParams.initialTime,
            "duration": blueprint.simParams.duration,
        },
        "entities": entities_list
    }


@blueprint_agent.tool
def add_entity(
    ctx: Context,
    entity_type: str,
    entity_uuid: str | None = None,
    parameters: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """
    Add a new entity to the current simulation blueprint.
    
    The blueprint is automatically loaded from and saved to storage.
    Use list_entity_types() to see available entity types and their required parameters.
    
    Args:
        entity_type: Type of entity (e.g., 'human', 'source', 'sink', 'buffer', 'manufacturing_cell').
                    Case-insensitive.
        entity_uuid: Optional UUID for the entity. If not provided, a new UUID will be generated.
        parameters: Dictionary of parameter names to values. 
                   For entity references (like buffer_in, buffer_out), use the UUID string of the referenced entity.
                   For primitive values, use the appropriate type (number, string, boolean).
    
    Returns:
        Dictionary with success message and the UUID of the created entity
    """
    # Get blueprint from storage
    storage = ctx.deps
    blueprint = storage.get_blueprint()

    # Validate entity type
    try:
        entity_type_enum = SimulationEntityType(entity_type.lower())
    except ValueError:
        available_types = [e.value for e in SimulationEntityType]
        raise ValueError(
            f"Invalid entity_type '{entity_type}'. "
            f"Available types: {available_types}. "
            f"Use list_entity_types() to see all available entity types and their parameters."
        )
    
    # Get entity class to validate it's registered
    from destiny_sim.builder.runner import get_registered_entities
    registered_entities = get_registered_entities()
    entity_class = registered_entities.get(entity_type_enum)
    
    if entity_class is None:
        raise ValueError(
            f"Entity type '{entity_type}' is not registered. "
            f"Available registered types: {[et.value for et in registered_entities.keys()]}. "
            f"Use list_entity_types() to see all available entity types."
        )
    
    # Get parameter schema for this entity type
    param_schema = entity_class.get_parameters_schema()
    
    # Generate UUID if not provided
    if entity_uuid is None:
        entity_uuid = str(uuid_lib.uuid4())
    
    # Check if UUID already exists
    existing_uuids = {e.uuid for e in blueprint.entities}
    if entity_uuid in existing_uuids:
        raise ValueError(
            f"Entity with UUID '{entity_uuid}' already exists in blueprint. "
            f"Use get_blueprint() to see existing entities, or use a different UUID."
        )
    
    # Build parameters dict
    blueprint_parameters: Dict[str, BlueprintEntityParameter] = {}
    
    # Validate all required parameters are provided
    required_params = set(param_schema.parameters.keys())
    provided_params = set(parameters.keys()) if parameters else set()
    missing_params = required_params - provided_params
    
    if missing_params:
        raise ValueError(
            f"Missing required parameters for entity type '{entity_type}': {sorted(missing_params)}. "
            f"Required parameters: {sorted(required_params)}. "
            f"Use list_entity_types() to see parameter details."
        )
    
    if parameters:
        for param_name, param_value in parameters.items():
            if param_name not in param_schema.parameters:
                available_params = sorted(param_schema.parameters.keys())
                raise ValueError(
                    f"Unknown parameter '{param_name}' for entity type '{entity_type}'. "
                    f"Available parameters: {available_params}. "
                    f"Use list_entity_types() to see parameter details."
                )
            
            param_info = param_schema.parameters[param_name]
            
            # Determine parameter type
            if param_info.type.value == "entity":
                # Entity reference - value should be a UUID string
                if not isinstance(param_value, str):
                    raise ValueError(
                        f"Parameter '{param_name}' is an entity reference and must be a UUID string, "
                        f"got {type(param_value).__name__}. "
                        f"Use get_blueprint() to find UUIDs of existing entities."
                    )
                
                # Validate referenced entity exists
                if param_value not in existing_uuids:
                    raise ValueError(
                        f"Entity reference '{param_value}' for parameter '{param_name}' does not exist. "
                        f"Use get_blueprint() to see all existing entity UUIDs."
                    )
                
                # Validate entity type if restricted
                if param_info.allowedEntityTypes:
                    referenced_entity = next((e for e in blueprint.entities if e.uuid == param_value), None)
                    if referenced_entity:
                        allowed_types = [et.value for et in param_info.allowedEntityTypes]
                        if referenced_entity.entityType not in param_info.allowedEntityTypes:
                            raise ValueError(
                                f"Parameter '{param_name}' must reference one of: {allowed_types}, "
                                f"but '{param_value}' is a '{referenced_entity.entityType.value}'. "
                                f"Use get_blueprint() to check entity types."
                            )
                
                parameter_type = BlueprintParameterType.ENTITY
            else:
                # Primitive parameter - validate type
                expected_type = param_info.type.value
                if expected_type == "number" and not isinstance(param_value, (int, float)):
                    raise ValueError(
                        f"Parameter '{param_name}' must be a number, got {type(param_value).__name__}"
                    )
                elif expected_type == "string" and not isinstance(param_value, str):
                    raise ValueError(
                        f"Parameter '{param_name}' must be a string, got {type(param_value).__name__}"
                    )
                elif expected_type == "boolean" and not isinstance(param_value, bool):
                    raise ValueError(
                        f"Parameter '{param_name}' must be a boolean, got {type(param_value).__name__}"
                    )
                
                parameter_type = BlueprintParameterType.PRIMITIVE
            
            blueprint_parameters[param_name] = BlueprintEntityParameter(
                name=param_name,
                parameterType=parameter_type,
                value=param_value,
            )
    
    # Create the blueprint entity
    blueprint_entity = BlueprintEntity(
        entityType=entity_type_enum,
        uuid=entity_uuid,
        parameters=blueprint_parameters,
    )
    
    # Add to blueprint
    blueprint.entities.append(blueprint_entity)

    # Save updated blueprint to storage
    storage.save_blueprint(blueprint)
    
    return {
        "success": True,
        "message": f"Successfully added {entity_type} entity",
        "uuid": entity_uuid,
        "entityType": entity_type_enum.value
    }


@blueprint_agent.tool
def update_entity(
    ctx: Context,
    entity_uuid: str,
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Update parameters of an existing entity in the blueprint.
    
    Only the parameters provided will be updated. Other parameters remain unchanged.
    Use get_blueprint() to see current entity state before updating.
    
    Args:
        entity_uuid: UUID of the entity to update
        parameters: Dictionary of parameter names to new values.
                   For entity references, use UUID strings.
                   For primitive values, use appropriate types.
    
    Returns:
        Dictionary with success message and updated entity info
    """
    storage = ctx.deps
    blueprint = storage.get_blueprint()
    
    # Find the entity
    entity = next((e for e in blueprint.entities if e.uuid == entity_uuid), None)
    if entity is None:
        existing_uuids = [e.uuid for e in blueprint.entities]
        raise ValueError(
            f"Entity with UUID '{entity_uuid}' not found. "
            f"Use get_blueprint() to see existing entities. "
            f"Available UUIDs: {existing_uuids[:10]}{'...' if len(existing_uuids) > 10 else ''}"
        )
    
    # Get entity class and schema
    from destiny_sim.builder.runner import get_registered_entities
    registered_entities = get_registered_entities()
    entity_class = registered_entities.get(entity.entityType)
    
    if entity_class is None:
        raise ValueError(
            f"Entity type '{entity.entityType.value}' is not registered. "
            f"Cannot validate parameters."
        )
    
    param_schema = entity_class.get_parameters_schema()
    existing_uuids = {e.uuid for e in blueprint.entities}
    
    # Update parameters
    for param_name, param_value in parameters.items():
        if param_name not in param_schema.parameters:
            available_params = sorted(param_schema.parameters.keys())
            raise ValueError(
                f"Unknown parameter '{param_name}' for entity type '{entity.entityType.value}'. "
                f"Available parameters: {available_params}. "
                f"Use list_entity_types() to see parameter details."
            )
        
        param_info = param_schema.parameters[param_name]
        
        # Determine parameter type
        if param_info.type.value == "entity":
            # Entity reference validation
            if not isinstance(param_value, str):
                raise ValueError(
                    f"Parameter '{param_name}' is an entity reference and must be a UUID string, "
                    f"got {type(param_value).__name__}"
                )
            
            if param_value not in existing_uuids:
                raise ValueError(
                    f"Entity reference '{param_value}' for parameter '{param_name}' does not exist. "
                    f"Use get_blueprint() to see all existing entity UUIDs."
                )
            
            # Validate entity type if restricted
            if param_info.allowedEntityTypes:
                referenced_entity = next((e for e in blueprint.entities if e.uuid == param_value), None)
                if referenced_entity:
                    allowed_types = [et.value for et in param_info.allowedEntityTypes]
                    if referenced_entity.entityType not in param_info.allowedEntityTypes:
                        raise ValueError(
                            f"Parameter '{param_name}' must reference one of: {allowed_types}, "
                            f"but '{param_value}' is a '{referenced_entity.entityType.value}'"
                        )
            
            parameter_type = BlueprintParameterType.ENTITY
        else:
            # Primitive parameter validation
            expected_type = param_info.type.value
            if expected_type == "number" and not isinstance(param_value, (int, float)):
                raise ValueError(
                    f"Parameter '{param_name}' must be a number, got {type(param_value).__name__}"
                )
            elif expected_type == "string" and not isinstance(param_value, str):
                raise ValueError(
                    f"Parameter '{param_name}' must be a string, got {type(param_value).__name__}"
                )
            elif expected_type == "boolean" and not isinstance(param_value, bool):
                raise ValueError(
                    f"Parameter '{param_name}' must be a boolean, got {type(param_value).__name__}"
                )
            
            parameter_type = BlueprintParameterType.PRIMITIVE
        
        # Update or add the parameter
        entity.parameters[param_name] = BlueprintEntityParameter(
            name=param_name,
            parameterType=parameter_type,
            value=param_value,
        )
    
    # Save updated blueprint
    storage.save_blueprint(blueprint)
    
    return {
        "success": True,
        "message": f"Successfully updated entity {entity_uuid}",
        "uuid": entity_uuid,
        "entityType": entity.entityType.value,
        "updatedParameters": list(parameters.keys())
    }


@blueprint_agent.tool
def remove_entity(
    ctx: Context,
    entity_uuid: str,
) -> Dict[str, Any]:
    """
    Remove an entity from the blueprint by UUID.
    
    WARNING: This will remove the entity even if other entities reference it.
    Make sure to update or remove dependent entities first.
    Use get_blueprint() to check for dependencies.
    
    Args:
        entity_uuid: UUID of the entity to remove
    
    Returns:
        Dictionary with success message
    """
    storage = ctx.deps
    blueprint = storage.get_blueprint()
    
    # Find and remove the entity
    entity = next((e for e in blueprint.entities if e.uuid == entity_uuid), None)
    if entity is None:
        existing_uuids = [e.uuid for e in blueprint.entities]
        raise ValueError(
            f"Entity with UUID '{entity_uuid}' not found. "
            f"Use get_blueprint() to see existing entities. "
            f"Available UUIDs: {existing_uuids[:10]}{'...' if len(existing_uuids) > 10 else ''}"
        )
    
    entity_type = entity.entityType.value
    blueprint.entities.remove(entity)
    
    # Save updated blueprint
    storage.save_blueprint(blueprint)
    
    return {
        "success": True,
        "message": f"Successfully removed {entity_type} entity {entity_uuid}",
        "uuid": entity_uuid,
        "entityType": entity_type
    }


@blueprint_agent.tool
def set_simulation_params(
    ctx: Context,
    duration: float | None = None,
    initial_time: float | None = None,
) -> Dict[str, Any]:
    """
    Set simulation parameters (duration and/or initial time).
    
    Args:
        duration: Simulation duration in time units. If None, keeps current value.
        initial_time: Starting time for the simulation. If None, keeps current value.
    
    Returns:
        Dictionary with success message and updated parameters
    """
    storage = ctx.deps
    blueprint = storage.get_blueprint()
    
    if duration is not None:
        blueprint.simParams.duration = duration
    
    if initial_time is not None:
        blueprint.simParams.initialTime = initial_time
    
    # Save updated blueprint
    storage.save_blueprint(blueprint)
    
    return {
        "success": True,
        "message": "Successfully updated simulation parameters",
        "simParams": {
            "duration": blueprint.simParams.duration,
            "initialTime": blueprint.simParams.initialTime,
        }
    }


@blueprint_agent.tool
def clear_blueprint(
    ctx: Context,
) -> Dict[str, Any]:
    """
    Clear the entire blueprint, removing all entities and resetting simulation parameters.
    
    WARNING: This action cannot be undone. All entities and their configurations will be lost.
    
    Returns:
        Dictionary with success message
    """
    storage = ctx.deps
    storage.clear_blueprint()
    
    return {
        "success": True,
        "message": "Blueprint cleared successfully"
    }


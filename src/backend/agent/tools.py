
from typing import Any, Dict

from destiny_sim.builder.entity import ParameterType
from destiny_sim.builder.schema import BlueprintEntity, BlueprintEntityParameter

from agent.storage import BlueprintStorage
from destiny_sim.builder.runner import Blueprint, BlueprintParameterType, get_registered_entities
from pydantic_ai import ModelRetry

from destiny_sim.core.timeline import SimulationEntityType


def list_entity_types() -> Dict[str, Any]:
    """
    List all available entity types and their parameters.
    
    Returns a dictionary mapping entity type names to their parameter schemas,
    including parameter names, types, and allowed entity types for entity references.
    
    Returns:
        Dictionary with entity types as keys and parameter information as values
    """
    
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


def get_blueprint(storage: BlueprintStorage) -> Dict[str, Any]:
    """
    Get the current blueprint state.
    
    Returns the complete blueprint including all entities and simulation parameters.
    Useful for checking what's already in the blueprint before making changes.
    
    Args:
        storage: BlueprintStorage instance
    Returns:
        Dictionary representation of the blueprint with entities and simParams
    """
    blueprint = storage.get_blueprint()
    
    # Convert to dict for better readability
    entities_list = []
    for entity in blueprint.entities:
        entity_dict = {
            "entityType": entity.entityType.value,
            "name": entity.name,
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


def add_entity(
    storage: BlueprintStorage,
    entity_type: str,
    entity_name: str | None = None,
    parameters: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """
    Add a new entity to the current simulation blueprint.
    
    The blueprint is automatically loaded from and saved to storage.
    Use list_entity_types() to see available entity types and their required parameters.
    
    Args:
        storage: BlueprintStorage instance
        entity_type: Type of entity (e.g., 'human', 'source', 'sink', 'buffer', 'manufacturing_cell').
                    Case-insensitive.
        entity_name: Optional name for the entity. If not provided, a name will be generated.
        parameters: Dictionary of parameter names to values. 
                   For entity references (like buffer_in, buffer_out), use the name string of the referenced entity.
                   For primitive values, use the appropriate type (number, string, boolean).
    
    Returns:
        Dictionary with success message and the name of the created entity
    """
    blueprint = storage.get_blueprint()

    entity_type_enum = _parse_entity_type(entity_type)
    entity_class = _get_entity_class(entity_type_enum)
    param_schema = entity_class.get_parameters_schema()
    
    # Generate name if not provided
    if entity_name is None:
        entity_name = _get_next_entity_name(entity_type_enum, blueprint)
    else:
        # Check if name already exists
        existing_names = {e.name for e in blueprint.entities}
        if entity_name in existing_names:
            raise ModelRetry(
                f"Entity with name '{entity_name}' already exists in blueprint. "
                f"Use get_blueprint() to see existing entities, or use a different name."
            )
    
    _validate_parameters(param_schema, parameters, entity_type)

    blueprint_parameters: Dict[str, BlueprintEntityParameter] = {}
    
    if parameters:
        for param_name, param_value in parameters.items():
            
            param_info = param_schema.parameters[param_name]
            
            # Determine parameter type
            if param_info.type.value == "entity":
                _validate_entity_parameter(param_name, param_value, param_info, blueprint)
                parameter_type = BlueprintParameterType.ENTITY
            else:
                _validate_primitive_parameter(param_name, param_value, param_info.type)
                parameter_type = BlueprintParameterType.PRIMITIVE
            
            blueprint_parameters[param_name] = BlueprintEntityParameter(
                name=param_name,
                parameterType=parameter_type,
                value=param_value,
            )

    # Create the blueprint entity
    blueprint_entity = BlueprintEntity(
        entityType=entity_type_enum,
        name=entity_name,
        parameters=blueprint_parameters,
    )
    
    # Add to blueprint
    blueprint.entities.append(blueprint_entity)

    # Save updated blueprint to storage
    storage.save_blueprint(blueprint)
    
    return {
        "success": True,
        "message": f"Successfully added {entity_type} entity",
        "name": entity_name,
        "entityType": entity_type_enum.value
    }


def get_canvas_size(
    storage: BlueprintStorage,
) -> Dict[str, Any] | str:
    """
    Get the canvas size in the blueprint.
    
    Args:
        storage: BlueprintStorage instance
    """
    blueprint = storage.get_blueprint()
    if blueprint.simParams.canvasSize is None:
        return "No canvas size set"
    return {
        "width": blueprint.simParams.canvasSize.width,
        "height": blueprint.simParams.canvasSize.height
    }


def rename_entity(
    storage: BlueprintStorage,
    entity_name: str,
    new_name: str,
) -> Dict[str, Any]:
    """
    Renames an entity in the blueprint and updates all entity parameter references that point to the old name.
    
    Args:
        storage: BlueprintStorage instance
        entity_name: Name of the entity to rename
        new_name: New name for the entity
    
    Returns:
        Dictionary with success message and updated entity info
    """
    blueprint = storage.get_blueprint()
    entity = _get_entity_by_name(entity_name, blueprint)

    entity.name = new_name
    
    # Update all entity parameter references that point to the old name
    for other_entity in blueprint.entities:
        for param_name, param in other_entity.parameters.items():
            if param.value == entity_name:
                other_entity.parameters[param_name] = BlueprintEntityParameter(
                    name=param_name,
                    parameterType=param.parameterType,
                    value=new_name,
                )

    storage.save_blueprint(blueprint)
    return {
        "success": True,
        "message": f"Successfully renamed entity {entity_name} to {new_name}",
        "name": new_name,
        "entityType": entity.entityType.value
    }


def update_entity_params(
    storage: BlueprintStorage,
    entity_name: str,
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Update parameters of an existing entity in the blueprint.
    
    Only the parameters provided will be updated. Other parameters remain unchanged.
    Use get_blueprint() to see current entity state before updating.
    
    Args:
        storage: BlueprintStorage instance
        entity_name: Name of the entity to update
        parameters: Dictionary of parameter names to new values.
                   For entity references, use name strings.
                   For primitive values, use appropriate types.
    
    Returns:
        Dictionary with success message and updated entity info
    """
    blueprint = storage.get_blueprint()
    
    # Find the entity
    entity = _get_entity_by_name(entity_name, blueprint)
    
    # Get entity class and schema
    entity_class = _get_entity_class(entity.entityType)
    param_schema = entity_class.get_parameters_schema()
    
    # Update parameters
    for param_name, param_value in parameters.items():
        _validate_parameter_exists(param_name, param_schema, entity.entityType.value)
        
        param_info = param_schema.parameters[param_name]
        
        # Determine parameter type
        if param_info.type == ParameterType.ENTITY:
            _validate_entity_parameter(param_name, param_value, param_info, blueprint)
            parameter_type = BlueprintParameterType.ENTITY
        else:
            _validate_primitive_parameter(param_name, param_value, param_info.type)
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
        "message": f"Successfully updated entity {entity_name}",
        "name": entity_name,
        "entityType": entity.entityType.value,
        "updatedParameters": list(parameters.keys())
    }


def remove_entity(
    storage: BlueprintStorage,
    entity_name: str,
) -> Dict[str, Any]:
    """
    Remove an entity from the blueprint by name.
    
    WARNING: This will remove the entity even if other entities reference it.
    Make sure to update or remove dependent entities first.
    Use get_blueprint() to check for dependencies.
    
    Args:
        storage: BlueprintStorage instance
        entity_name: Name of the entity to remove
    
    Returns:
        Dictionary with success message
    """
    blueprint = storage.get_blueprint()
    
    # Find and remove the entity
    entity = _get_entity_by_name(entity_name, blueprint)
        
    # Remove all references to this entity from other entities
    for other_entity in blueprint.entities:
        for param_name, param in other_entity.parameters.items():
            if param.value == entity_name:
                del other_entity.parameters[param_name]

    entity_type = entity.entityType.value
    blueprint.entities.remove(entity)
    
    # Save updated blueprint
    storage.save_blueprint(blueprint)
    
    return {
        "success": True,
        "message": f"Successfully removed {entity_type} entity {entity_name}",
        "name": entity_name,
        "entityType": entity_type
    }


def set_simulation_params(
    storage: BlueprintStorage,
    duration: float | None = None,
    initial_time: float | None = None,
) -> Dict[str, Any]:
    """
    Set simulation parameters (duration and/or initial time).
    
    Args:
        storage: BlueprintStorage instance
        duration: Simulation duration in time units. If None, keeps current value.
        initial_time: Starting time for the simulation. If None, keeps current value.
    
    Returns:
        Dictionary with success message and updated parameters
    """
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


def clear_blueprint(storage: BlueprintStorage) -> Dict[str, Any]:
    """
    Clear the entire blueprint, removing all entities and resetting simulation parameters.
    
    WARNING: This action cannot be undone. All entities and their configurations will be lost.
    
    Args:
        storage: BlueprintStorage instance
    
    Returns:
        Dictionary with success message
    """
    storage.clear_blueprint()
    
    return {
        "success": True,
        "message": "Blueprint cleared successfully"
    }


def _get_entity_by_name(entity_name: str, blueprint: Blueprint) -> BlueprintEntity:
    entity = next((e for e in blueprint.entities if e.name == entity_name), None)
    if entity is None:
        existing_names = [e.name for e in blueprint.entities][:10]
        raise ModelRetry(
            f"Entity with name '{entity_name}' not found. "
            f"Use get_blueprint() to see existing entities. "
            f"Available names: {existing_names[:10]}{'...' if len(existing_names) > 10 else ''}"
        )
    return entity


def _parse_entity_type(entity_type: str) -> SimulationEntityType:
    try:
        return SimulationEntityType(entity_type.lower())
    except ValueError:
        available_types = [e.value for e in SimulationEntityType]
        raise ModelRetry(
            f"Invalid entity_type '{entity_type}'. "
            f"Available types: {available_types}. "
            f"Use list_entity_types() to see all available entity types and their parameters."
        )


def _get_entity_class(entity_type: SimulationEntityType):
    from destiny_sim.builder.runner import get_registered_entities
    registered_entities = get_registered_entities()
    entity_class = registered_entities.get(entity_type)
    
    if entity_class is None:
        raise ModelRetry(
            f"Entity type '{entity_type}' is not registered. "
            f"Available registered types: {[et.value for et in registered_entities.keys()]}. "
            f"Use list_entity_types() to see all available entity types."
        )
    
    return entity_class


def _validate_parameter_exists(param_name: str, param_schema, entity_type: str):
    if param_name not in param_schema.parameters:
        available_params = sorted(param_schema.parameters.keys())
        raise ModelRetry(
            f"Unknown parameter '{param_name}' for entity type '{entity_type}'. "
            f"Available parameters: {available_params}. "
            f"Use list_entity_types() to see parameter details."
        )


def _validate_parameters(param_schema, parameters: Dict[str, Any] | None, entity_type: str):
    required_params = set(param_schema.parameters.keys())
    provided_params = set(parameters.keys()) if parameters else set()
    missing_params = required_params - provided_params
    
    if missing_params:
        raise ModelRetry(
            f"Missing required parameters for entity type '{entity_type}': {sorted(missing_params)}. "
            f"Required parameters: {sorted(required_params)}. "
            f"Use list_entity_types() to see parameter details."
        )
    
    if parameters:
        for param_name in parameters.keys():
            _validate_parameter_exists(param_name, param_schema, entity_type)


def _validate_entity_parameter(param_name: str, param_value: Any, param_info, blueprint: Blueprint):
    if not isinstance(param_value, str):
        raise ModelRetry(
            f"Parameter '{param_name}' is an entity reference and must be a name string, "
            f"got {type(param_value).__name__}. "
            f"Use get_blueprint() to find names of existing entities."
        )
    
    existing_names = {e.name for e in blueprint.entities}
    if param_value not in existing_names:
        raise ModelRetry(
            f"Entity reference '{param_value}' for parameter '{param_name}' does not exist. "
            f"Use get_blueprint() to see all existing entity names."
        )
    
    if param_info.allowedEntityTypes:
        referenced_entity = next((e for e in blueprint.entities if e.name == param_value), None)
        if referenced_entity:
            allowed_types = [et.value for et in param_info.allowedEntityTypes]
            if referenced_entity.entityType not in param_info.allowedEntityTypes:
                raise ModelRetry(
                    f"Parameter '{param_name}' must reference one of: {allowed_types}, "
                    f"but '{param_value}' is a '{referenced_entity.entityType.value}'. "
                    f"Use get_blueprint() to check entity types."
                )


def _validate_primitive_parameter(param_name: str, param_value: Any, expected_type: ParameterType):
    if expected_type == ParameterType.NUMBER and not isinstance(param_value, (int, float)):
        raise ModelRetry(
            f"Parameter '{param_name}' must be a number, got {type(param_value).__name__}"
        )
    elif expected_type == ParameterType.STRING and not isinstance(param_value, str):
        raise ModelRetry(
            f"Parameter '{param_name}' must be a string, got {type(param_value).__name__}"
        )
    elif expected_type == ParameterType.BOOLEAN and not isinstance(param_value, bool):
        raise ModelRetry(
            f"Parameter '{param_name}' must be a boolean, got {type(param_value).__name__}"
        )


def _get_next_entity_name(entity_type: SimulationEntityType, blueprint) -> str:
    """
    Generate the next default name for an entity type based on existing entities.
    Format: "{EntityType} {number}" (e.g., "Source 1", "Buffer 2")
    Uses gap-aware logic: finds the first available number starting from 1.
    """
    # Capitalize first letter of entity type
    entity_type_str = entity_type.value
    capitalized_type = entity_type_str[0].upper() + entity_type_str[1:] if entity_type_str else ""
    
    # Get all existing entities of the same type
    existing_entities = [e for e in blueprint.entities if e.entityType == entity_type]
    
    # Extract numbers from existing names
    # Pattern: "{Type} {number}" - extract the number part
    import re
    used_numbers = set()
    name_pattern = re.compile(f"^{re.escape(capitalized_type)} (\\d+)$")
    
    for entity in existing_entities:
        match = name_pattern.match(entity.name)
        if match:
            num = int(match.group(1))
            used_numbers.add(num)
    
    # Find the first available number starting from 1
    next_number = 1
    while next_number in used_numbers:
        next_number += 1
    
    return f"{capitalized_type} {next_number}"


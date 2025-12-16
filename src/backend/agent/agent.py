from typing import Dict, Any, Type

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.builder.runner import get_registered_entities
from pydantic_ai import Agent, ModelRetry, RunContext

from destiny_sim.builder.schema import (
    BlueprintEntity,
    BlueprintEntityParameter,
    BlueprintParameterType,
)
from destiny_sim.core.rendering import SimulationEntityType

from agent.prompts import SYSTEM_PROMPT_TEMPLATE, get_entity_info_string
from agent.storage import BlueprintStorage


def _init_blueprint_agent():
    entity_info_string = get_entity_info_string()
    
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(entity_types=entity_info_string)
    return Agent("openai:gpt-5.2", deps_type=BlueprintStorage, system_prompt=system_prompt)


blueprint_agent = _init_blueprint_agent()


Context = RunContext[BlueprintStorage]


@blueprint_agent.tool(sequential=True)
def list_entity_types(ctx: Context) -> Dict[str, Any]:
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


@blueprint_agent.tool(sequential=True)
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


@blueprint_agent.tool(sequential=True)
def add_entity(
    ctx: Context,
    entity_type: str,
    entity_name: str | None = None,
    parameters: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    """
    Add a new entity to the current simulation blueprint.
    
    The blueprint is automatically loaded from and saved to storage.
    Use list_entity_types() to see available entity types and their required parameters.
    
    Args:
        entity_type: Type of entity (e.g., 'human', 'source', 'sink', 'buffer', 'manufacturing_cell').
                    Case-insensitive.
        entity_name: Optional name for the entity. If not provided, a name will be generated.
        parameters: Dictionary of parameter names to values. 
                   For entity references (like buffer_in, buffer_out), use the name string of the referenced entity.
                   For primitive values, use the appropriate type (number, string, boolean).
    
    Returns:
        Dictionary with success message and the name of the created entity
    """
    # Get blueprint from storage
    storage = ctx.deps
    blueprint = storage.get_blueprint()

    # Validate entity type
    try:
        entity_type_enum = SimulationEntityType(entity_type.lower())
    except ValueError:
        available_types = [e.value for e in SimulationEntityType]
        raise ModelRetry(
            f"Invalid entity_type '{entity_type}'. "
            f"Available types: {available_types}. "
            f"Use list_entity_types() to see all available entity types and their parameters."
        )
    
    # Get entity class to validate it's registered
    from destiny_sim.builder.runner import get_registered_entities
    registered_entities = get_registered_entities()
    entity_class = registered_entities.get(entity_type_enum)
    
    if entity_class is None:
        raise ModelRetry(
            f"Entity type '{entity_type}' is not registered. "
            f"Available registered types: {[et.value for et in registered_entities.keys()]}. "
            f"Use list_entity_types() to see all available entity types."
        )
    
    # Get parameter schema for this entity type
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
    
    # Build parameters dict
    blueprint_parameters: Dict[str, BlueprintEntityParameter] = {}
    
    # Validate all required parameters are provided
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
        for param_name, param_value in parameters.items():
            if param_name not in param_schema.parameters:
                available_params = sorted(param_schema.parameters.keys())
                raise ModelRetry(
                    f"Unknown parameter '{param_name}' for entity type '{entity_type}'. "
                    f"Available parameters: {available_params}. "
                    f"Use list_entity_types() to see parameter details."
                )
            
            param_info = param_schema.parameters[param_name]
            
            # Determine parameter type
            if param_info.type.value == "entity":
                # Entity reference - value should be a name string
                if not isinstance(param_value, str):
                    raise ModelRetry(
                        f"Parameter '{param_name}' is an entity reference and must be a name string, "
                        f"got {type(param_value).__name__}. "
                        f"Use get_blueprint() to find names of existing entities."
                    )
                
                # Validate referenced entity exists
                existing_names = {e.name for e in blueprint.entities}
                if param_value not in existing_names:
                    print(f"Tried to reference non-existent entity")
                    
                    raise ModelRetry(
                        f"Entity reference '{param_value}' for parameter '{param_name}' does not exist. "
                        f"Use get_blueprint() to see all existing entity names."
                    )
                
                # Validate entity type if restricted
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
                
                parameter_type = BlueprintParameterType.ENTITY
            else:
                # Primitive parameter - validate type
                expected_type = param_info.type.value
                if expected_type == "number" and not isinstance(param_value, (int, float)):
                    raise ModelRetry(
                        f"Parameter '{param_name}' must be a number, got {type(param_value).__name__}"
                    )
                elif expected_type == "string" and not isinstance(param_value, str):
                    raise ModelRetry(
                        f"Parameter '{param_name}' must be a string, got {type(param_value).__name__}"
                    )
                elif expected_type == "boolean" and not isinstance(param_value, bool):
                    raise ModelRetry(
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


@blueprint_agent.tool(sequential=True)
def get_canvas_size(
    ctx: Context,
) -> Dict[str, Any] | str:
    """
    Get the canvas size in the blueprint.
    """
    storage = ctx.deps
    blueprint = storage.get_blueprint()
    if blueprint.simParams.canvasSize is None:
        return "No canvas size set"
    return {
        "width": blueprint.simParams.canvasSize.width,
        "height": blueprint.simParams.canvasSize.height
    }


@blueprint_agent.tool(sequential=True)
def update_entity(
    ctx: Context,
    entity_name: str,
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Update parameters of an existing entity in the blueprint.
    
    Only the parameters provided will be updated. Other parameters remain unchanged.
    Use get_blueprint() to see current entity state before updating.
    
    Args:
        entity_name: Name of the entity to update
        parameters: Dictionary of parameter names to new values.
                   For entity references, use name strings.
                   For primitive values, use appropriate types.
    
    Returns:
        Dictionary with success message and updated entity info
    """
    storage = ctx.deps
    blueprint = storage.get_blueprint()
    
    # Find the entity
    entity = next((e for e in blueprint.entities if e.name == entity_name), None)
    if entity is None:
        existing_names = [e.name for e in blueprint.entities]
        raise ModelRetry(
            f"Entity with name '{entity_name}' not found. "
            f"Use get_blueprint() to see existing entities. "
            f"Available names: {existing_names[:10]}{'...' if len(existing_names) > 10 else ''}"
        )
    
    # Get entity class and schema
    from destiny_sim.builder.runner import get_registered_entities
    registered_entities = get_registered_entities()
    entity_class = registered_entities.get(entity.entityType)
    
    if entity_class is None:
        raise ModelRetry(
            f"Entity type '{entity.entityType.value}' is not registered. "
            f"Cannot validate parameters."
        )
    
    param_schema = entity_class.get_parameters_schema()
    existing_names = {e.name for e in blueprint.entities}
    
    # Update parameters
    for param_name, param_value in parameters.items():
        if param_name not in param_schema.parameters:
            available_params = sorted(param_schema.parameters.keys())
            raise ModelRetry(
                f"Unknown parameter '{param_name}' for entity type '{entity.entityType.value}'. "
                f"Available parameters: {available_params}. "
                f"Use list_entity_types() to see parameter details."
            )
        
        param_info = param_schema.parameters[param_name]
        
        # Determine parameter type
        if param_info.type.value == "entity":
            # Entity reference validation
            if not isinstance(param_value, str):
                raise ModelRetry(
                    f"Parameter '{param_name}' is an entity reference and must be a name string, "
                    f"got {type(param_value).__name__}"
                )
            
            if param_value not in existing_names:
                raise ModelRetry(
                    f"Entity reference '{param_value}' for parameter '{param_name}' does not exist. "
                    f"Use get_blueprint() to see all existing entity names."
                )
            
            # Validate entity type if restricted
            if param_info.allowedEntityTypes:
                referenced_entity = next((e for e in blueprint.entities if e.name == param_value), None)
                if referenced_entity:
                    allowed_types = [et.value for et in param_info.allowedEntityTypes]
                    if referenced_entity.entityType not in param_info.allowedEntityTypes:
                        raise ModelRetry(
                            f"Parameter '{param_name}' must reference one of: {allowed_types}, "
                            f"but '{param_value}' is a '{referenced_entity.entityType.value}'"
                        )
            
            parameter_type = BlueprintParameterType.ENTITY
        else:
            # Primitive parameter validation
            expected_type = param_info.type.value
            if expected_type == "number" and not isinstance(param_value, (int, float)):
                raise ModelRetry(
                    f"Parameter '{param_name}' must be a number, got {type(param_value).__name__}"
                )
            elif expected_type == "string" and not isinstance(param_value, str):
                raise ModelRetry(
                    f"Parameter '{param_name}' must be a string, got {type(param_value).__name__}"
                )
            elif expected_type == "boolean" and not isinstance(param_value, bool):
                raise ModelRetry(
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
        "message": f"Successfully updated entity {entity_name}",
        "name": entity_name,
        "entityType": entity.entityType.value,
        "updatedParameters": list(parameters.keys())
    }


@blueprint_agent.tool(sequential=True)
def remove_entity(
    ctx: Context,
    entity_name: str,
) -> Dict[str, Any]:
    """
    Remove an entity from the blueprint by name.
    
    WARNING: This will remove the entity even if other entities reference it.
    Make sure to update or remove dependent entities first.
    Use get_blueprint() to check for dependencies.
    
    Args:
        entity_name: Name of the entity to remove
    
    Returns:
        Dictionary with success message
    """
    storage = ctx.deps
    blueprint = storage.get_blueprint()
    
    # Find and remove the entity
    entity = next((e for e in blueprint.entities if e.name == entity_name), None)
    if entity is None:
        existing_names = [e.name for e in blueprint.entities]
        raise ModelRetry(
            f"Entity with name '{entity_name}' not found. "
            f"Use get_blueprint() to see existing entities. "
            f"Available names: {existing_names[:10]}{'...' if len(existing_names) > 10 else ''}"
        )
    
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


@blueprint_agent.tool(sequential=True)
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


@blueprint_agent.tool(sequential=True)
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


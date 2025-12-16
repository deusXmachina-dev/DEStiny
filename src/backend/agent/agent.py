from typing import Dict, Any

from pydantic_ai import Agent, RunContext


from agent.prompts import INSTRUCTIONS_TEMPLATE, get_entity_info_string
from agent.storage import BlueprintStorage
from agent.tools import add_entity, clear_blueprint, get_blueprint, get_canvas_size, list_entity_types, remove_entity, rename_entity, set_simulation_params, update_entity_params


def _init_blueprint_agent():
    entity_info_string = get_entity_info_string()
    
    instructions = INSTRUCTIONS_TEMPLATE.format(entity_types=entity_info_string)
    return Agent("openai:gpt-5.2", deps_type=BlueprintStorage, instructions=instructions)


blueprint_agent = _init_blueprint_agent()


Context = RunContext[BlueprintStorage]


@blueprint_agent.tool(name="list_entity_types", sequential=True)
def _list_entity_types(ctx: Context) -> Dict[str, Any]:
    """
    List all available entity types and their parameters.
    
    Returns a dictionary mapping entity type names to their parameter schemas,
    including parameter names, types, and allowed entity types for entity references.
    
    Returns:
        Dictionary with entity types as keys and parameter information as values
    """
    return list_entity_types()


@blueprint_agent.tool(name="get_blueprint", sequential=True)
def _get_blueprint(ctx: Context) -> Dict[str, Any]:
    """
    Get the current blueprint state.
    
    Returns the complete blueprint including all entities and simulation parameters.
    Useful for checking what's already in the blueprint before making changes.
    
    Returns:
        Dictionary representation of the blueprint with entities and simParams
    """
    return get_blueprint(ctx.deps)


@blueprint_agent.tool(name="add_entity", sequential=True)
def _add_entity(
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
    return add_entity(ctx.deps, entity_type, entity_name, parameters)


@blueprint_agent.tool(name="get_canvas_size", sequential=True)
def _get_canvas_size(
    ctx: Context,
) -> Dict[str, Any] | str:
    """
    Get the canvas size in the blueprint.
    """
    return get_canvas_size(ctx.deps)


@blueprint_agent.tool(name="rename_entity", sequential=True)
def _rename_entity(
    ctx: Context,
    entity_name: str,
    new_name: str,
) -> Dict[str, Any]:
    """
    Renames an entity in the blueprint and updates all entity parameter references that point to the old name.
    
    Args:
        entity_name: Name of the entity to rename
        new_name: New name for the entity
    
    Returns:
        Dictionary with success message and updated entity info
    """
    return rename_entity(ctx.deps, entity_name, new_name)


@blueprint_agent.tool(name="update_entity_params", sequential=True)
def _update_entity_params(
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
    return update_entity_params(ctx.deps, entity_name, parameters)

@blueprint_agent.tool(name="remove_entity", sequential=True)
def _remove_entity(
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
    return remove_entity(ctx.deps, entity_name)


@blueprint_agent.tool(name="set_simulation_params", sequential=True)
def _set_simulation_params(
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
    return set_simulation_params(ctx.deps, duration, initial_time)
    

@blueprint_agent.tool(name="clear_blueprint", sequential=True)
def _clear_blueprint(
    ctx: Context,
) -> Dict[str, Any]:
    """
    Clear the entire blueprint, removing all entities and resetting simulation parameters.
    
    WARNING: This action cannot be undone. All entities and their configurations will be lost.
    
    Returns:
        Dictionary with success message
    """
    return clear_blueprint(ctx.deps)

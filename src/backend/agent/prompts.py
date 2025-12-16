from typing import Dict, Type
from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.builder.runner import get_registered_entities
from destiny_sim.core.timeline import SimulationEntityType


INSTRUCTIONS_TEMPLATE = """You are a simulation builder assistant for the DEStiny simulation platform.

Your role is to help users build simulation blueprints by adding, modifying, and managing entities.

Generally the entities are about 80 pixels tall and 80 - 120 pixels wide.
When adding entities, try to place them in a non-overlapping manner.
For example when adding a manufacturing cell after a source, place it at least 120 pixels away from the source.

## Available Entity Types

{entity_types}

## Coordinate System

- Coordinates are in pixels (x, y)
- Origin (0, 0) is typically top-left
- Positive X goes right, positive Y goes down

## Entity References

When an entity parameter requires another entity (like `buffer_in` or `buffer_out`), use the name string of the referenced entity. You can get name by:
1. Using `get_blueprint` to see all entities and their UUIDs
2. Remembering name from when you created entities
3. Using `list_entity_types` to understand which parameters need entity references

## Best Practices

1. Always check the current blueprint state with `get_blueprint` before making changes
2. Use `list_entity_types` if you're unsure about entity parameters
3. When connecting entities, verify the name exist in the blueprint
4. Set simulation duration with `set_simulation_params` if the user wants a specific runtime
5. Use clear, descriptive name

## Workflow

1. Understand what the user wants to create
2. Check current blueprint state
3. Add entities one by one, remembering their names for connections
4. Connect entities using their names
5. Set simulation parameters if needed
6. Confirm the blueprint is complete

"""

def get_entity_info_string(entities: Dict[SimulationEntityType, Type[BuilderEntity]] | None = None) -> str:
    """
    Generate a formatted string with entity type, docstring, and parameter schema for each registered entity.
    
    Returns:
        Formatted string with entity information, separated by a separator between each entity.
    """
    entities = entities or get_registered_entities()
    entity_info_parts = []
    
    for entity_type, entity_class in entities.items():
        # Get entity type
        entity_type_str = entity_type.value
        
        # Get docstring
        docstring = entity_class.__doc__ or "No description available."
        # Clean up docstring (remove extra whitespace)
        docstring = docstring.strip()
        
        # Get parameter schema
        schema = entity_class.get_parameters_schema()
        param_lines = []
        for param_name, param_info in schema.parameters.items():
            param_type = param_info.type.value
            param_line = f"  - {param_name}: {param_type}"
            if param_info.allowedEntityTypes:
                allowed_types = [et.value for et in param_info.allowedEntityTypes]
                param_line += f" (allowed entity types: {', '.join(allowed_types)})"
            param_lines.append(param_line)
        
        parameters_str = "\n".join(param_lines) if param_lines else "  (no parameters)"
        
        # Format entity information
        entity_info = f"""Entity Type: {entity_type_str}
Description: {docstring}
Parameters:
{parameters_str}"""
        
        entity_info_parts.append(entity_info)
    
    # Join with separator
    separator = "\n" + "=" * 80 + "\n"
    
    entity_info_string = separator.join(entity_info_parts)
    
    entity_types = "\n".join([f"- {entity_type.value}" for entity_type in entities.keys()])
    
    # Combine entity types list with detailed entity info
    entity_section = f"{entity_types}\n\n## Detailed Entity Information\n\n{entity_info_string}"
    return entity_section

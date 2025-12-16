"""
Tests for agent prompts module.
"""

import pytest
from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import SimulationEntityType

from agent.prompts import get_entity_info_string


def test_get_entity_info_string_includes_docstring_and_parameter():
    """Test that get_entity_info_string includes docstring and parameters."""
    
    class TestEntity(BuilderEntity):
        """
        A simple test entity for testing prompt generation.
        This entity has a docstring and a parameter.
        """
        entity_type = SimulationEntityType.AGV
        
        def __init__(
            self,
            env: RecordingEnvironment,
            test_param: float,
        ):
            super().__init__()
            self.test_param = test_param
    
    # Create a dictionary with the test entity
    entities = {SimulationEntityType.AGV: TestEntity}
    
    # Get the entity info string
    result = get_entity_info_string(entities)
    
    # Assert docstring is present
    assert "A simple test entity for testing prompt generation" in result
    assert "This entity has a docstring and a parameter" in result
    
    # Assert parameter is present
    assert "test_param" in result
    assert "number" in result  # float maps to number type (lowercase)
    
    # Assert entity type is present
    assert "agv" in result
    assert "Entity Type: agv" in result

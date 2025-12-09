"""Tests for BuilderEntity schema generation."""

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.builder.entities.human import Human
from destiny_sim.core.environment import RecordingEnvironment


def test_human_schema_generation():
    """Test that Human entity generates correct parameter schema."""
    schema = Human.get_parameters_schema()
    
    # Should have all the parameters from Human.__init__ (excluding self and env)
    assert "x" in schema
    assert "y" in schema
    assert "targetX" in schema
    assert "targetY" in schema
    
    # All should be "number" type (float)
    assert schema["x"] == "number"
    assert schema["y"] == "number"
    assert schema["targetX"] == "number"
    assert schema["targetY"] == "number"
    
    # Should not include self or env
    assert "self" not in schema
    assert "env" not in schema


def test_schema_type_mapping():
    """Test that schema generation correctly maps Python types to frontend types."""
    
    class TestEntity(BuilderEntity):
        entity_type = "test"
        
        def __init__(
            self,
            env: RecordingEnvironment,
            num_int: int,
            num_float: float,
            text: str,
            flag: bool,
        ):
            super().__init__(env)
    
    schema = TestEntity.get_parameters_schema()
    
    assert schema["num_int"] == "number"
    assert schema["num_float"] == "number"
    assert schema["text"] == "string"
    assert schema["flag"] == "boolean"
    
    # Should exclude self and env
    assert "self" not in schema
    assert "env" not in schema


def test_schema_with_no_parameters():
    """Test that schema generation works for entities with no custom parameters."""
    
    class MinimalEntity(BuilderEntity):
        entity_type = "minimal"
        
        def __init__(self, env: RecordingEnvironment):
            super().__init__(env)
    
    schema = MinimalEntity.get_parameters_schema()
    
    # Should be empty (only self and env, which are excluded)
    assert schema == {}


def test_schema_excludes_kwargs():
    """Test that schema generation excludes *args and **kwargs."""
    
    class KwargsEntity(BuilderEntity):
        entity_type = "kwargs_test"
        
        def __init__(
            self,
            env: RecordingEnvironment,
            normal_param: float,
            *args,
            **kwargs,
        ):
            super().__init__(env)
    
    schema = KwargsEntity.get_parameters_schema()
    
    # Should only include normal_param
    assert "normal_param" in schema
    assert schema["normal_param"] == "number"
    
    # Should exclude args and kwargs
    assert "args" not in schema
    assert "kwargs" not in schema

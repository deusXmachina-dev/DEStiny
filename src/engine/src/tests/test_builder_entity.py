"""Tests for BuilderEntity schema generation."""

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.builder.entities.human import Human
from destiny_sim.builder.schema import ParameterType
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import SimulationEntityType


def test_human_schema_generation():
    """Test that Human entity generates correct parameter schema."""
    schema = Human.get_parameters_schema()
    
    # Schema should be a BuilderEntitySchema instance
    assert schema.entityType == "human"
    
    params = schema.parameters
    
    # Should have all the parameters from Human.__init__ (excluding self and env)
    assert "x" in params
    assert "y" in params
    assert "targetX" in params
    assert "targetY" in params
    
    # All should be ParameterType.NUMBER (float)
    assert params["x"] == ParameterType.NUMBER
    assert params["y"] == ParameterType.NUMBER
    assert params["targetX"] == ParameterType.NUMBER
    assert params["targetY"] == ParameterType.NUMBER
    
    # Should not include self or env
    assert "self" not in params
    assert "env" not in params


def test_schema_type_mapping():
    """Test that schema generation correctly maps Python types to frontend types."""
    
    class TestEntity(BuilderEntity):
        entity_type = SimulationEntityType.AGV
        
        def __init__(
            self,
            env: RecordingEnvironment,
            num_int: int,
            num_float: float,
            text: str,
            flag: bool,
        ):
            super().__init__()
    
    schema = TestEntity.get_parameters_schema()
    params = schema.parameters
    
    assert params["num_int"] == ParameterType.NUMBER
    assert params["num_float"] == ParameterType.NUMBER
    assert params["text"] == ParameterType.STRING
    assert params["flag"] == ParameterType.BOOLEAN
    
    # Should exclude self and env
    assert "self" not in params
    assert "env" not in params


def test_schema_with_no_parameters():
    """Test that schema generation works for entities with no custom parameters."""
    
    class MinimalEntity(BuilderEntity):
        entity_type = SimulationEntityType.ROBOT
        
        def __init__(self, env: RecordingEnvironment):
            super().__init__()
    
    schema = MinimalEntity.get_parameters_schema()

    # Should have entityType and parameters (parameters should be empty)
    assert schema.entityType == SimulationEntityType.ROBOT
    assert schema.parameters == {}


def test_schema_excludes_kwargs():
    """Test that schema generation excludes *args and **kwargs."""
    
    class KwargsEntity(BuilderEntity):
        entity_type = SimulationEntityType.BOX
        
        def __init__(
            self,
            env: RecordingEnvironment,
            normal_param: float,
            *args,
            **kwargs,
        ):
            super().__init__()
    
    schema = KwargsEntity.get_parameters_schema()
    params = schema.parameters
    
    # Should only include normal_param
    assert "normal_param" in params
    assert params["normal_param"] == ParameterType.NUMBER
    
    # Should exclude args and kwargs
    assert "args" not in params
    assert "kwargs" not in params

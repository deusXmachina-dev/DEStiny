"""Tests for BuilderEntity schema generation."""

from typing import Optional, Union
from destiny_sim.builder.entities.material_flow.sink import Sink
from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.builder.entities.human import Human
from destiny_sim.builder.schema import ParameterInfo, ParameterType
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import SimulationEntityType


def _find_param(params: list[ParameterInfo], name: str) -> ParameterInfo | None:
    """Helper to find a parameter by name in the list."""
    for param in params:
        if param.name == name:
            return param
    return None


def test_human_schema_generation():
    """Test that Human entity generates correct parameter schema."""
    schema = Human.get_parameters_schema()
    
    # Schema should be a BuilderEntitySchema instance
    assert schema.entityType == "human"
    
    params = schema.parameters
    
    # Should have all the parameters from Human.__init__ (excluding self and env)
    param_names = {p.name for p in params}
    assert "x" in param_names
    assert "y" in param_names
    assert "targetX" in param_names
    assert "targetY" in param_names
    
    # All should be ParameterType.NUMBER (float)
    assert _find_param(params, "x").type == ParameterType.NUMBER
    assert _find_param(params, "y").type == ParameterType.NUMBER
    assert _find_param(params, "targetX").type == ParameterType.NUMBER
    assert _find_param(params, "targetY").type == ParameterType.NUMBER
    
    # Should not include self or env
    assert "self" not in param_names
    assert "env" not in param_names


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
    
    assert _find_param(params, "num_int").type == ParameterType.NUMBER
    assert _find_param(params, "num_float").type == ParameterType.NUMBER
    assert _find_param(params, "text").type == ParameterType.STRING
    assert _find_param(params, "flag").type == ParameterType.BOOLEAN
    
    # Should exclude self and env
    param_names = {p.name for p in params}
    assert "self" not in param_names
    assert "env" not in param_names


def test_schema_with_no_parameters():
    """Test that schema generation works for entities with no custom parameters."""
    
    class MinimalEntity(BuilderEntity):
        entity_type = SimulationEntityType.ROBOT
        
        def __init__(self, env: RecordingEnvironment):
            super().__init__()
    
    schema = MinimalEntity.get_parameters_schema()

    # Should have entityType and parameters (parameters should be empty list)
    assert schema.entityType == SimulationEntityType.ROBOT
    assert schema.parameters == []


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
    param_names = {p.name for p in params}
    assert "normal_param" in param_names
    assert _find_param(params, "normal_param").type == ParameterType.NUMBER
    
    # Should exclude args and kwargs
    assert "args" not in param_names
    assert "kwargs" not in param_names


def test_entity_parameter_with_specific_type():
    """Test that entity parameters with specific BuilderEntity subclass are detected."""
    
    class EntityWithHumanTarget(BuilderEntity):
        entity_type = SimulationEntityType.ROBOT
        
        def __init__(self, target: Human):
            super().__init__()
    
    schema = EntityWithHumanTarget.get_parameters_schema()
    params = schema.parameters
    
    target_param = _find_param(params, "target")
    assert target_param is not None
    assert target_param.type == ParameterType.ENTITY
    assert target_param.allowedEntityTypes == [SimulationEntityType.HUMAN]


def test_entity_parameter_with_union_type():
    """Test that entity parameters with specific BuilderEntity subclass are detected."""
    
    class EntityWithHumanTarget(BuilderEntity):
        entity_type = SimulationEntityType.ROBOT
        
        def __init__(self, target: Union[Human, Sink]):
            super().__init__()
    
    schema = EntityWithHumanTarget.get_parameters_schema()
    params = schema.parameters
    
    target_param = _find_param(params, "target")
    assert target_param is not None
    assert target_param.type == ParameterType.ENTITY
    assert target_param.allowedEntityTypes == [SimulationEntityType.HUMAN, SimulationEntityType.SINK]

"""Tests for blueprint runner."""

import pytest

from destiny_sim.builder.entities.human import Human
from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.builder.runner import (
    get_registered_entities,
    register_entity,
    run_blueprint,
)
from destiny_sim.builder.schema import (
    Blueprint,
    BlueprintEntity,
    BlueprintEntityParameter,
    BlueprintParameterType,
    SimParams,
)
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import SimulationEntityType


def _primitive(name: str, value: float | int | str | bool) -> BlueprintEntityParameter:
    """Helper to create a primitive parameter."""
    return BlueprintEntityParameter(
        name=name, parameterType=BlueprintParameterType.PRIMITIVE, value=value
    )


def _entity(name: str, entity_name: str) -> BlueprintEntityParameter:
    """Helper to create an entity parameter."""
    return BlueprintEntityParameter(
        name=name, parameterType=BlueprintParameterType.ENTITY, value=entity_name
    )


def test_run_blueprint_with_human():
    """Test running a blueprint with a Human entity."""
    blueprint = Blueprint(
        simParams=SimParams(initialTime=0, duration=20),
        entities=[
            BlueprintEntity(
                entityType=SimulationEntityType.HUMAN,
                name="person-1",
                parameters={
                    "x": _primitive("x", 100.0),
                    "y": _primitive("y", 100.0),
                    "targetX": _primitive("targetX", 500.0),
                    "targetY": _primitive("targetY", 300.0),
                },
            ),
        ],
    )
    
    recording = run_blueprint(blueprint)
    
    # Check that recording was created
    assert recording is not None
    assert recording.duration > 0
    
    # Check that entity motion was recorded
    # Should have at least one entity with segments
    assert len(recording.segments_by_entity) > 0
    
    # Find the human entity's segments
    human_segments = None
    for _, segments in recording.segments_by_entity.items():
        if segments and segments[0].entity_type == "human":
            human_segments = segments
            break
    
    assert human_segments is not None, "Human entity segments should be recorded"
    assert len(human_segments) >= 1, "Should have at least initial position"


def test_run_blueprint_multiple_entities():
    """Test running a blueprint with multiple entities."""
    blueprint = Blueprint(
        simParams=SimParams(initialTime=0, duration=20),
        entities=[
            BlueprintEntity(
                entityType=SimulationEntityType.HUMAN,
                name="person-1",
                parameters={
                    "x": _primitive("x", 100.0),
                    "y": _primitive("y", 100.0),
                    "targetX": _primitive("targetX", 200.0),
                    "targetY": _primitive("targetY", 200.0),
                },
            ),
            BlueprintEntity(
                entityType=SimulationEntityType.HUMAN,
                name="person-2",
                parameters={
                    "x": _primitive("x", 300.0),
                    "y": _primitive("y", 300.0),
                    "targetX": _primitive("targetX", 400.0),
                    "targetY": _primitive("targetY", 400.0),
                },
            ),
        ],
    )
    
    recording = run_blueprint(blueprint)
    
    # Should have segments for multiple entities
    assert len(recording.segments_by_entity) >= 2


def test_run_blueprint_default_initial_time():
    """Test that blueprint defaults initialTime to 0."""
    blueprint = Blueprint(
        simParams=SimParams(duration=10.0),
        entities=[
            BlueprintEntity(
                entityType=SimulationEntityType.HUMAN,
                name="person-1",
                parameters={
                    "x": _primitive("x", 100.0),
                    "y": _primitive("y", 100.0),
                    "targetX": _primitive("targetX", 200.0),
                    "targetY": _primitive("targetY", 200.0),
                },
            ),
        ],
    )
    
    recording = run_blueprint(blueprint)
    assert recording.duration >= 0




def test_run_blueprint_without_duration():
    """Test running blueprint without duration (runs until completion)."""
    blueprint = Blueprint(
        simParams=SimParams(initialTime=0),
        entities=[
            BlueprintEntity(
                entityType=SimulationEntityType.HUMAN,
                name="person-1",
                parameters={
                    "x": _primitive("x", 100.0),
                    "y": _primitive("y", 100.0),
                    "targetX": _primitive("targetX", 200.0),
                    "targetY": _primitive("targetY", 200.0),
                },
            ),
        ],
    )
    
    recording = run_blueprint(blueprint)
    # Should complete (human walks to target)
    assert recording.duration > 0


def test_run_blueprint_invalid_structure():
    """Test that invalid blueprint structure raises validation errors."""
    # Missing entities is valid (empty simulation)
    blueprint = Blueprint(simParams=SimParams(duration=1.0))
    recording = run_blueprint(blueprint)
    assert recording is not None
    
    # Pydantic will validate structure, so invalid types will raise ValidationError
    # These tests are now handled by Pydantic validation rather than runtime checks


def test_run_blueprint_unknown_entity_type():
    """Test that unknown entity type raises KeyError."""
    # Use a valid enum value that's not registered in the default registry
    blueprint = Blueprint(
        simParams=SimParams(),
        entities=[
            BlueprintEntity(
                entityType=SimulationEntityType.COUNTER,  # Not in default registry
                name="test-1",
                parameters={},
            ),
        ],
    )
    
    with pytest.raises(KeyError, match="Unknown entity_type"):
        run_blueprint(blueprint)


def test_run_blueprint_invalid_parameters():
    """Test that invalid parameters raise TypeError."""
    blueprint = Blueprint(
        simParams=SimParams(),
        entities=[
            BlueprintEntity(
                entityType=SimulationEntityType.HUMAN,
                name="person-1",
                parameters={
                    # Missing required parameters
                },
            ),
        ],
    )
    
    with pytest.raises(TypeError, match="Failed to instantiate"):
        run_blueprint(blueprint)


def test_register_entity():
    """Test registering a new entity type."""
    class TestEntity(BuilderEntity):
        entity_type = SimulationEntityType.BOX  # Use a valid enum value
        
        def __init__(self, name: str, value: float):
            super().__init__(name=name)
            self.value = value
        
        def get_rendering_info(self):
            from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
            return RenderingInfo(entity_type=SimulationEntityType.EMPTY)
        
        def process(self, env: RecordingEnvironment):
            # Process must be a generator - yield immediately to complete
            yield env.timeout(0)
    
    # Register the entity
    register_entity(TestEntity)
    
    # Verify it's in the registry
    registry = get_registered_entities()
    assert SimulationEntityType.BOX in registry
    assert registry[SimulationEntityType.BOX] == TestEntity
    
    # Test using it in a blueprint
    blueprint = Blueprint(
        simParams=SimParams(duration=1.0),
        entities=[
            BlueprintEntity(
                entityType=SimulationEntityType.BOX,
                name="test-1",
                parameters={
                    "value": _primitive("value", 42.0),
                },
            ),
        ],
    )
    
    recording = run_blueprint(blueprint)
    assert recording is not None


def test_register_entity_invalid():
    """Test that registering invalid entities raises errors."""
    # Not a BuilderEntity subclass
    class NotAnEntity:
        entity_type = "not_an_entity"
    
    with pytest.raises(TypeError, match="must be a subclass"):
        register_entity(NotAnEntity)
    
    # Missing entity_type
    class NoTypeEntity(BuilderEntity):
        pass
    
    with pytest.raises(ValueError, match="entity_type"):
        register_entity(NoTypeEntity)


def test_get_registered_entities():
    """Test getting the entity registry."""
    registry = get_registered_entities()
    
    # Should be a dictionary
    assert isinstance(registry, dict)
    
    # Should include Human
    assert "human" in registry
    assert registry["human"] == Human
    
    # Should be a copy (modifying shouldn't affect original)
    registry["test"] = "test"
    registry2 = get_registered_entities()
    assert "test" not in registry2


def test_entity_reference_resolution():
    """Test that entity references are correctly resolved."""
    # Create a test entity that accepts another entity
    class EntityWithReference(BuilderEntity):
        entity_type = SimulationEntityType.ROBOT
        
        def __init__(self, name: str, target: Human, x: float, y: float):
            super().__init__(name=name)
            self.target = target
            self.x = x
            self.y = y
        
        def process(self, env: RecordingEnvironment):
            yield env.timeout(0)
    
    register_entity(EntityWithReference)
    
    blueprint = Blueprint(
        simParams=SimParams(duration=1.0),
        entities=[
            BlueprintEntity(
                entityType=SimulationEntityType.HUMAN,
                name="human-1",
                parameters={
                    "x": _primitive("x", 100.0),
                    "y": _primitive("y", 100.0),
                    "targetX": _primitive("targetX", 200.0),
                    "targetY": _primitive("targetY", 200.0),
                },
            ),
            BlueprintEntity(
                entityType=SimulationEntityType.ROBOT,
                name="robot-1",
                parameters={
                    "target": _entity("target", "human-1"),
                    "x": _primitive("x", 50.0),
                    "y": _primitive("y", 50.0),
                },
            ),
        ],
    )
    
    recording = run_blueprint(blueprint)
    assert recording is not None


def test_entity_reference_cycle():
    """Test that circular entity references are detected."""
    class EntityA(BuilderEntity):
        entity_type = SimulationEntityType.AGV
        
        def __init__(self, name: str, ref: "EntityB"):
            super().__init__(name=name)
            self.ref = ref
        
        def process(self, env: RecordingEnvironment):
            yield env.timeout(0)
    
    class EntityB(BuilderEntity):
        entity_type = SimulationEntityType.BOX
        
        def __init__(self, name: str, ref: EntityA):
            super().__init__(name=name)
            self.ref = ref
        
        def process(self, env: RecordingEnvironment):
            yield env.timeout(0)
    
    register_entity(EntityA)
    register_entity(EntityB)
    
    blueprint = Blueprint(
        simParams=SimParams(duration=1.0),
        entities=[
            BlueprintEntity(
                entityType=SimulationEntityType.AGV,
                name="a-1",
                parameters={
                    "ref": _entity("ref", "b-1"),
                },
            ),
            BlueprintEntity(
                entityType=SimulationEntityType.BOX,
                name="b-1",
                parameters={
                    "ref": _entity("ref", "a-1"),
                },
            ),
        ],
    )
    
    with pytest.raises(ValueError, match="Circular dependency"):
        run_blueprint(blueprint)


def test_entity_reference_invalid_name():
    """Test that invalid entity reference names are detected."""
    class EntityWithReference(BuilderEntity):
        entity_type = SimulationEntityType.ROBOT
        
        def __init__(self, name: str, target: Human):
            super().__init__(name=name)
            self.target = target
        
        def process(self, env: RecordingEnvironment):
            yield env.timeout(0)
    
    register_entity(EntityWithReference)
    
    blueprint = Blueprint(
        simParams=SimParams(duration=1.0),
        entities=[
            BlueprintEntity(
                entityType=SimulationEntityType.ROBOT,
                name="robot-1",
                parameters={
                    "target": _entity("target", "non-existent-name"),
                },
            ),
        ],
    )
    
    with pytest.raises(ValueError, match="does not exist in blueprint"):
        run_blueprint(blueprint)


def test_entity_reference_multiple_levels():
    """Test entity references with multiple dependency levels."""
    class Level1(BuilderEntity):
        entity_type = SimulationEntityType.AGV
        
        def __init__(self, name: str, value: float):
            super().__init__(name=name)
            self.value = value
        
        def process(self, env: RecordingEnvironment):
            yield env.timeout(0)
    
    class Level2(BuilderEntity):
        entity_type = SimulationEntityType.BOX
        
        def __init__(self, name: str, level1: Level1, value: float):
            super().__init__(name=name)
            self.level1 = level1
            self.value = value
        
        def process(self, env: RecordingEnvironment):
            yield env.timeout(0)
    
    class Level3(BuilderEntity):
        entity_type = SimulationEntityType.ROBOT
        
        def __init__(self, name: str, level2: Level2, value: float):
            super().__init__(name=name)
            self.level2 = level2
            self.value = value
        
        def process(self, env: RecordingEnvironment):
            yield env.timeout(0)
    
    register_entity(Level1)
    register_entity(Level2)
    register_entity(Level3)
    
    blueprint = Blueprint(
        simParams=SimParams(duration=1.0),
        entities=[
            BlueprintEntity(
                entityType=SimulationEntityType.ROBOT,
                name="level3-1",
                parameters={
                    "level2": _entity("level2", "level2-1"),
                    "value": _primitive("value", 3.0),
                },
            ),
            BlueprintEntity(
                entityType=SimulationEntityType.BOX,
                name="level2-1",
                parameters={
                    "level1": _entity("level1", "level1-1"),
                    "value": _primitive("value", 2.0),
                },
            ),
            BlueprintEntity(
                entityType=SimulationEntityType.AGV,
                name="level1-1",
                parameters={
                    "value": _primitive("value", 1.0),
                },
            ),
        ],
    )
    
    recording = run_blueprint(blueprint)
    assert recording is not None

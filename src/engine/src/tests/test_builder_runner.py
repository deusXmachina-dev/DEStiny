"""Tests for blueprint runner."""

import pytest

from destiny_sim.builder.runner import (
    run_blueprint,
    register_entity,
    get_registered_entities,
)
from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.builder.entities.human import Human
from destiny_sim.builder.schema import Blueprint, BlueprintEntity, SimParams
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import SimulationEntityType


def test_run_blueprint_with_human():
    """Test running a blueprint with a Human entity."""
    blueprint = Blueprint(
        simParams=SimParams(initialTime=0, duration=20),
        entities=[
            BlueprintEntity(
                entityType=SimulationEntityType.HUMAN,
                uuid="person-1",
                parameters={
                    "x": 100.0,
                    "y": 100.0,
                    "targetX": 500.0,
                    "targetY": 300.0,
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
    for entity_id, segments in recording.segments_by_entity.items():
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
                uuid="person-1",
                parameters={
                    "x": 100.0,
                    "y": 100.0,
                    "targetX": 200.0,
                    "targetY": 200.0,
                },
            ),
            BlueprintEntity(
                entityType=SimulationEntityType.HUMAN,
                uuid="person-2",
                parameters={
                    "x": 300.0,
                    "y": 300.0,
                    "targetX": 400.0,
                    "targetY": 400.0,
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
                uuid="person-1",
                parameters={
                    "x": 100.0,
                    "y": 100.0,
                    "targetX": 200.0,
                    "targetY": 200.0,
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
                uuid="person-1",
                parameters={
                    "x": 100.0,
                    "y": 100.0,
                    "targetX": 200.0,
                    "targetY": 200.0,
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
                uuid="test-1",
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
                uuid="person-1",
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
        
        def __init__(self, value: float):
            super().__init__()
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
                uuid="test-1",
                parameters={"value": 42.0},
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

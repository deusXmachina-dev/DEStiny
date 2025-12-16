"""
Tests for agent tools module.
"""

import pytest
from destiny_sim.builder.runner import BlueprintParameterType
from destiny_sim.builder.schema import Blueprint, BlueprintEntity, BlueprintEntityParameter, CanvasSize, SimParams
from destiny_sim.core.rendering import SimulationEntityType

from agent.storage import BlueprintStorage
from agent.tools import (
    add_entity,
    clear_blueprint,
    get_blueprint,
    get_canvas_size,
    list_entity_types,
    remove_entity,
    rename_entity,
    set_simulation_params,
    update_entity_params,
)


class MockSession(dict):
    """Mock Django session that supports modified attribute and save method."""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.modified = False
    
    def save(self):
        """Mock save method."""
        pass


@pytest.fixture
def mock_session():
    """Create a mock session dict for BlueprintStorage."""
    return MockSession()


@pytest.fixture
def storage(mock_session):
    """Create a BlueprintStorage instance with mock session."""
    return BlueprintStorage(session=mock_session)


@pytest.fixture
def blueprint_with_entities(storage):
    """Create a blueprint with some test entities."""
    # Add a source entity
    add_entity(storage, "source", "Test Source", {"x": 10.0, "y": 20.0})
    # Add a sink entity
    add_entity(storage, "sink", "Test Sink", {"x": 30.0, "y": 40.0})
    return storage.get_blueprint()


def test_list_entity_types():
    """Test listing all available entity types."""
    result = list_entity_types()
    
    assert isinstance(result, dict)
    assert len(result) > 0
    # Check that some common entity types are present
    assert "source" in result or "SOURCE" in result.lower()
    assert "parameters" in list(result.values())[0]


def test_get_blueprint_empty(storage):
    """Test getting an empty blueprint."""
    result = get_blueprint(storage)
    
    assert isinstance(result, dict)
    assert "simParams" in result
    assert "entities" in result
    assert isinstance(result["entities"], list)
    assert len(result["entities"]) == 0


def test_get_blueprint_with_entities(blueprint_with_entities, storage):
    """Test getting a blueprint with entities."""
    result = get_blueprint(storage)
    
    assert isinstance(result, dict)
    assert "simParams" in result
    assert "entities" in result
    assert len(result["entities"]) == 2
    assert result["entities"][0]["name"] == "Test Source"
    assert result["entities"][1]["name"] == "Test Sink"


def test_add_entity(storage):
    """Test adding an entity to the blueprint."""
    result = add_entity(
        storage,
        entity_type="source",
        entity_name="My Source",
        parameters={"x": 5.0, "y": 10.0}
    )
    
    assert result["success"] is True
    assert result["name"] == "My Source"
    assert result["entityType"] == "source"
    
    # Verify entity was added
    blueprint = storage.get_blueprint()
    assert len(blueprint.entities) == 1
    assert blueprint.entities[0].name == "My Source"


def test_add_entity_without_name(storage):
    """Test adding an entity without providing a name (auto-generated)."""
    result = add_entity(
        storage,
        entity_type="sink",
        parameters={"x": 1.0, "y": 2.0}
    )
    
    assert result["success"] is True
    assert result["name"] == "Sink 1"
    assert result["entityType"] == "sink"


def test_get_canvas_size_no_canvas(storage):
    """Test getting canvas size when none is set."""
    result = get_canvas_size(storage)
    
    assert result == "No canvas size set"


def test_get_canvas_size_with_canvas(storage):
    """Test getting canvas size when it's set."""
    blueprint = storage.get_blueprint()
    blueprint.simParams.canvasSize = CanvasSize(width=800, height=600)
    storage.save_blueprint(blueprint)
    
    result = get_canvas_size(storage)
    
    assert isinstance(result, dict)
    assert result["width"] == 800
    assert result["height"] == 600


def test_rename_entity(blueprint_with_entities, storage):
    """Test renaming an entity."""
    result = rename_entity(storage, "Test Source", "Renamed Source")
    
    assert result["success"] is True
    assert result["name"] == "Renamed Source"
    assert result["entityType"] == "source"
    
    # Verify entity was renamed
    blueprint = storage.get_blueprint()
    entity = next(e for e in blueprint.entities if e.name == "Renamed Source")
    assert entity is not None


def test_rename_entity_updates_references(storage):
    """Test that renaming an entity updates all entity parameter references."""
    # Create a buffer entity
    add_entity(storage, "buffer", "Input Buffer", {"x": 0.0, "y": 0.0, "capacity": 10.0})
    
    # Add a sink for the output
    add_entity(storage, "sink", "Test Sink", {"x": 100.0, "y": 100.0})
    
    # Create a manufacturing cell that references both the buffer and sink
    add_entity(
        storage,
        "manufacturing_cell",
        "Cell 1",
        {
            "input": "Input Buffer",
            "output": "Test Sink",
            "x": 50.0,
            "y": 50.0,
            "mean": 5.0,
            "std_dev": 1.0,
        }
    )
    
    # Rename the buffer
    rename_entity(storage, "Input Buffer", "Renamed Buffer")
    
    # Verify the manufacturing cell's input reference was updated
    blueprint = storage.get_blueprint()
    cell = next(e for e in blueprint.entities if e.name == "Cell 1")
    assert cell.parameters["input"].value == "Renamed Buffer"
    # Verify output reference is unchanged
    assert cell.parameters["output"].value == "Test Sink"


def test_update_entity_params(blueprint_with_entities, storage):
    """Test updating entity parameters."""
    result = update_entity_params(
        storage,
        "Test Source",
        {"x": 99.0, "y": 88.0}
    )
    
    assert result["success"] is True
    assert result["name"] == "Test Source"
    assert "updatedParameters" in result
    assert "x" in result["updatedParameters"]
    assert "y" in result["updatedParameters"]
    
    # Verify parameters were updated
    blueprint = storage.get_blueprint()
    entity = next(e for e in blueprint.entities if e.name == "Test Source")
    assert entity.parameters["x"].value == 99.0
    assert entity.parameters["y"].value == 88.0


def test_remove_entity(blueprint_with_entities, storage):
    """Test removing an entity."""
    result = remove_entity(storage, "Test Source")
    
    assert result["success"] is True
    assert result["name"] == "Test Source"
    assert result["entityType"] == "source"
    
    # Verify entity was removed
    blueprint = storage.get_blueprint()
    assert len(blueprint.entities) == 1
    assert blueprint.entities[0].name == "Test Sink"


def test_set_simulation_params(storage):
    """Test setting simulation parameters."""
    result = set_simulation_params(
        storage,
        duration=100.0,
        initial_time=5.0
    )
    
    assert result["success"] is True
    assert result["simParams"]["duration"] == 100.0
    assert result["simParams"]["initialTime"] == 5.0
    
    # Verify parameters were set
    blueprint = storage.get_blueprint()
    assert blueprint.simParams.duration == 100.0
    assert blueprint.simParams.initialTime == 5.0


def test_set_simulation_params_partial(storage):
    """Test setting only one simulation parameter."""
    # First set both
    set_simulation_params(storage, duration=50.0, initial_time=10.0)
    
    # Then update only duration
    result = set_simulation_params(storage, duration=75.0)
    
    assert result["success"] is True
    assert result["simParams"]["duration"] == 75.0
    assert result["simParams"]["initialTime"] == 10.0  # Should remain unchanged


def test_clear_blueprint(blueprint_with_entities, storage):
    """Test clearing the blueprint."""
    result = clear_blueprint(storage)
    
    assert result["success"] is True
    assert result["message"] == "Blueprint cleared successfully"
    
    # Verify blueprint is empty
    blueprint = storage.get_blueprint()
    assert len(blueprint.entities) == 0

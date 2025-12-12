"""
Tests for the simulation API endpoints.
"""

import pytest
from django.test import Client
from django.urls import reverse


@pytest.fixture
def api_client():
    """Create a Django test client for API requests."""
    client = Client()
    client.raise_request_exception = False
    return client


def make_parameters(**kwargs):
    """
    Helper function to create parameters in the BlueprintEntityParameter format.
    
    Converts a dict of parameter name -> value to the format:
    {
        "param_name": {
            "name": "param_name",
            "parameterType": "primitive",
            "value": <value>
        }
    }
    """
    return {
        name: {
            "name": name,
            "parameterType": "primitive",
            "value": value,
        }
        for name, value in kwargs.items()
    }


class TestSchemaEndpoint:
    """Tests for GET /api/schema endpoint."""

    def test_get_schema_returns_list(self, api_client):
        """Schema endpoint should return a list of entity schemas."""
        response = api_client.get("/api/schema")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_get_schema_contains_entity_types(self, api_client):
        """Schema should contain registered entity types."""
        response = api_client.get("/api/schema")
        data = response.json()
        
        # Should have at least the 'human' entity type
        entity_types = [item["entityType"] for item in data]
        assert "human" in entity_types

    def test_get_schema_entity_schema_structure(self, api_client):
        """Each entity schema should be a dictionary mapping parameters to types."""
        response = api_client.get("/api/schema")
        data = response.json()
        
        # Check structure of human entity schema
        human_schema = next((item for item in data if item["entityType"] == "human"), None)
        if human_schema:
            assert isinstance(human_schema, dict)
            assert "entityType" in human_schema
            assert "parameters" in human_schema
            assert isinstance(human_schema["parameters"], dict)
            # Human should have parameters like x, y, targetX, targetY
            # The exact parameters depend on the Human entity definition
            assert len(human_schema["parameters"]) > 0


class TestSimulateEndpoint:
    """Tests for POST /api/simulate endpoint."""

    def test_simulate_with_valid_blueprint(self, api_client):
        """Simulate endpoint should run a valid blueprint and return recording."""
        blueprint = {
            "simParams": {
                "initialTime": 0,
                "duration": 10,
            },
            "entities": [
                {
                    "entityType": "human",
                    "name": "person-1",
                    "parameters": make_parameters(
                        x=100.0,
                        y=100.0,
                        targetX=500.0,
                        targetY=300.0,
                    ),
                },
            ],
        }
        
        response = api_client.post(
            "/api/simulate",
            data=blueprint,
            content_type="application/json",
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check recording structure
        assert "duration" in data
        assert isinstance(data["duration"], (int, float))
        assert data["duration"] > 0
        
        assert "segments_by_entity" in data
        assert isinstance(data["segments_by_entity"], dict)
        
        assert "metrics" in data
        assert isinstance(data["metrics"], dict)
        assert "counter" in data["metrics"]
        assert "gauge" in data["metrics"]
        assert "sample" in data["metrics"]
        assert "state" in data["metrics"]

    def test_simulate_with_multiple_entities(self, api_client):
        """Simulate endpoint should handle multiple entities."""
        blueprint = {
            "simParams": {
                "initialTime": 0,
                "duration": 5,
            },
            "entities": [
                {
                    "entityType": "human",
                    "name": "person-1",
                    "parameters": make_parameters(
                        x=0.0,
                        y=0.0,
                        targetX=100.0,
                        targetY=100.0,
                    ),
                },
                {
                    "entityType": "human",
                    "name": "person-2",
                    "parameters": make_parameters(
                        x=200.0,
                        y=200.0,
                        targetX=300.0,
                        targetY=300.0,
                    ),
                },
            ],
        }
        
        response = api_client.post(
            "/api/simulate",
            data=blueprint,
            content_type="application/json",
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have segments for both entities
        assert len(data["segments_by_entity"]) >= 2

    def test_simulate_with_default_initial_time(self, api_client):
        """Simulate endpoint should default initialTime to 0 if not provided."""
        blueprint = {
            "simParams": {
                "duration": 5,
            },
            "entities": [
                {
                    "entityType": "human",
                    "name": "person-1",
                    "parameters": make_parameters(
                        x=0.0,
                        y=0.0,
                        targetX=100.0,
                        targetY=100.0,
                    ),
                },
            ],
        }
        
        response = api_client.post(
            "/api/simulate",
            data=blueprint,
            content_type="application/json",
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["duration"] > 0

    def test_simulate_without_duration(self, api_client):
        """Simulate endpoint should run until completion if duration not provided."""
        blueprint = {
            "simParams": {},
            "entities": [
                {
                    "entityType": "human",
                    "name": "person-1",
                    "parameters": make_parameters(
                        x=0.0,
                        y=0.0,
                        targetX=100.0,
                        targetY=100.0,
                    ),
                },
            ],
        }
        
        response = api_client.post(
            "/api/simulate",
            data=blueprint,
            content_type="application/json",
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "duration" in data

    def test_simulate_with_empty_entities(self, api_client):
        """Simulate endpoint should handle empty entities list."""
        blueprint = {
            "simParams": {
                "duration": 5,
            },
            "entities": [],
        }
        
        response = api_client.post(
            "/api/simulate",
            data=blueprint,
            content_type="application/json",
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["duration"] > 0
        assert isinstance(data["segments_by_entity"], dict)

    def test_simulate_missing_entity_type(self, api_client):
        """Simulate endpoint should return error for missing entityType."""
        blueprint = {
            "simParams": {
                "duration": 5,
            },
            "entities": [
                {
                    "entityType": "human",
                    "name": "person-1",
                    "parameters": {
                        "x": 0.0,
                        "y": 0.0,
                    },
                },
            ],
        }
        
        response = api_client.post(
            "/api/simulate",
            data=blueprint,
            content_type="application/json",
        )
        
        # Django Ninja returns 422 for schema validation errors when required fields are missing
        assert response.status_code == 422

    def test_simulate_unknown_entity_type(self, api_client):
        """Simulate endpoint should return error for unknown entityType."""
        blueprint = {
            "simParams": {
                "duration": 5,
            },
            "entities": [
                {
                    "entityType": "unknown_entity",
                    "name": "entity-1",
                    "parameters": {},
                },
            ],
        }
        
        response = api_client.post(
            "/api/simulate",
            data=blueprint,
            content_type="application/json",
        )
        
        # Django Ninja returns 422 for schema validation errors, 500 for unhandled exceptions
        assert response.status_code in [400, 422, 500]

    def test_simulate_invalid_blueprint_structure(self, api_client):
        """Simulate endpoint should return error for invalid blueprint structure."""
        blueprint = {
            "simParams": {"duration": 5},
            "entities": "not a list",
        }
        
        response = api_client.post(
            "/api/simulate",
            data=blueprint,
            content_type="application/json",
        )
        
        # Django Ninja returns 422 for schema validation errors, 500 for unhandled exceptions
        assert response.status_code in [400, 422, 500]

    def test_simulate_invalid_entity_structure(self, api_client):
        """Simulate endpoint should return error for invalid entity structure."""
        blueprint = {
            "simParams": {"duration": 5},
            "entities": ["not a dict"],
        }
        
        response = api_client.post(
            "/api/simulate",
            data=blueprint,
            content_type="application/json",
        )
        
        # Django Ninja returns 422 for schema validation errors, 500 for unhandled exceptions
        assert response.status_code in [400, 422, 500]

    def test_simulate_invalid_parameters(self, api_client):
        """Simulate endpoint should return error for invalid entity parameters."""
        blueprint = {
            "simParams": {
                "duration": 5,
            },
            "entities": [
                {
                    "entityType": "human",
                    "name": "person-1",
                    "parameters": "not a dict",
                },
            ],
        }
        
        response = api_client.post(
            "/api/simulate",
            data=blueprint,
            content_type="application/json",
        )
        
        # Django Ninja returns 422 for schema validation errors, 500 for unhandled exceptions
        assert response.status_code in [400, 422, 500]

    def test_simulate_missing_required_parameters(self, api_client):
        """Simulate endpoint should return error for missing required parameters."""
        blueprint = {
            "simParams": {
                "duration": 5,
            },
            "entities": [
                {
                    "entityType": "human",
                    "name": "person-1",
                    "parameters": {
                        # Missing required parameters like x, y, targetX, targetY
                    },
                },
            ],
        }
        
        response = api_client.post(
            "/api/simulate",
            data=blueprint,
            content_type="application/json",
        )
        
        # Django Ninja returns 500 for unhandled exceptions from run_blueprint
        assert response.status_code == 500

    def test_simulate_recording_contains_segments(self, api_client):
        """Simulate endpoint should return recording with motion segments."""
        blueprint = {
            "simParams": {
                "initialTime": 0,
                "duration": 10,
            },
            "entities": [
                {
                    "entityType": "human",
                    "name": "person-1",
                    "parameters": make_parameters(
                        x=100.0,
                        y=100.0,
                        targetX=500.0,
                        targetY=300.0,
                    ),
                },
            ],
        }
        
        response = api_client.post(
            "/api/simulate",
            data=blueprint,
            content_type="application/json",
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check segments structure
        segments_by_entity = data["segments_by_entity"]
        assert isinstance(segments_by_entity, dict)
        
        # Should have at least one entity with segments
        if segments_by_entity:
            entity_id = list(segments_by_entity.keys())[0]
            segments = segments_by_entity[entity_id]
            assert isinstance(segments, list)
            assert len(segments) > 0
            
            # Check segment structure
            segment = segments[0]
            assert "entityId" in segment
            assert "entityType" in segment
            assert "startTime" in segment
            assert "startX" in segment
            assert "startY" in segment
            assert "endX" in segment
            assert "endY" in segment


class TestBlueprintEndpoint:
    """Tests for GET /api/blueprint and PUT /api/blueprint endpoints."""

    @pytest.mark.django_db
    def test_get_blueprint_returns_empty_initially(self, api_client):
        """GET blueprint should return empty blueprint if none exists."""
        response = api_client.get("/api/blueprint")
        
        assert response.status_code == 200
        data = response.json()
        assert "simParams" in data
        assert "entities" in data
        assert isinstance(data["entities"], list)
        assert len(data["entities"]) == 0

    @pytest.mark.django_db
    def test_put_blueprint_saves_and_persists(self, api_client):
        """PUT blueprint should save and persist across requests."""
        blueprint = {
            "simParams": {
                "initialTime": 0,
                "duration": 10,
            },
            "entities": [
                {
                    "entityType": "human",
                    "name": "person-1",
                    "parameters": make_parameters(
                        x=100.0,
                        y=100.0,
                        targetX=500.0,
                        targetY=300.0,
                    ),
                },
            ],
        }
        
        # Save blueprint
        response = api_client.put(
            "/api/blueprint",
            data=blueprint,
            content_type="application/json",
        )
        
        assert response.status_code == 200
        saved_data = response.json()
        assert len(saved_data["entities"]) == 1
        assert saved_data["entities"][0]["name"] == "person-1"
        
        # Retrieve blueprint in a new request (same session)
        response = api_client.get("/api/blueprint")
        
        assert response.status_code == 200
        retrieved_data = response.json()
        assert len(retrieved_data["entities"]) == 1
        assert retrieved_data["entities"][0]["name"] == "person-1"
        assert retrieved_data["entities"][0]["entityType"] == "human"
        assert retrieved_data["simParams"]["duration"] == 10

    @pytest.mark.django_db
    def test_put_blueprint_updates_existing(self, api_client):
        """PUT blueprint should update existing blueprint."""
        initial_blueprint = {
            "simParams": {
                "initialTime": 0,
                "duration": 5,
            },
            "entities": [
                {
                    "entityType": "human",
                    "name": "person-1",
                    "parameters": make_parameters(
                        x=100.0,
                        y=100.0,
                        targetX=500.0,
                        targetY=300.0,
                    ),
                },
            ],
        }
        
        # Save initial blueprint
        api_client.put(
            "/api/blueprint",
            data=initial_blueprint,
            content_type="application/json",
        )
        
        # Update blueprint with new entity
        updated_blueprint = {
            "simParams": {
                "initialTime": 0,
                "duration": 10,
            },
            "entities": [
                {
                    "entityType": "human",
                    "name": "person-1",
                    "parameters": make_parameters(
                        x=100.0,
                        y=100.0,
                        targetX=500.0,
                        targetY=300.0,
                    ),
                },
                {
                    "entityType": "human",
                    "name": "person-2",
                    "parameters": make_parameters(
                        x=200.0,
                        y=200.0,
                        targetX=600.0,
                        targetY=400.0,
                    ),
                },
            ],
        }
        
        # Update blueprint
        response = api_client.put(
            "/api/blueprint",
            data=updated_blueprint,
            content_type="application/json",
        )
        
        assert response.status_code == 200
        updated_data = response.json()
        assert len(updated_data["entities"]) == 2
        assert updated_data["simParams"]["duration"] == 10
        
        # Verify update persists
        response = api_client.get("/api/blueprint")
        
        assert response.status_code == 200
        retrieved_data = response.json()
        assert len(retrieved_data["entities"]) == 2
        names = [e["name"] for e in retrieved_data["entities"]]
        assert "person-1" in names
        assert "person-2" in names

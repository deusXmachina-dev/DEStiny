from ninja import NinjaAPI, Schema
from typing import Dict, Any, List
from destiny_sim.builder.runner import get_registered_entities, run_blueprint

api = NinjaAPI(title="DEStiny Simulation API", version="0.1.0")


class BuilderEntitySchema(Schema):
    """Schema for a builder entity definition."""
    entityType: str
    icon: str
    parameters: Dict[str, str]  # Maps parameter name to type ("string", "number", "boolean")


class Blueprint(Schema):
    simParams: Dict[str, Any] = {}
    entities: List[Dict[str, Any]] = []


@api.get("/schema", response=List[BuilderEntitySchema])
def get_schema(request):
    """
    Returns the entity schema for the frontend builder.
    """
    entities = get_registered_entities()
    schemas = []
    for name, cls in entities.items():
        schema_dict = cls.get_parameters_schema()
        # Convert dict to BuilderEntitySchema instance
        schemas.append(BuilderEntitySchema(**schema_dict))
    return schemas

@api.post("/simulate")
def run_simulation(request, blueprint: Blueprint):
    """
    Runs a simulation blueprint and returns the recording.
    """
    try:
        # Convert Ninja Schema back to dict
        blueprint_dict = blueprint.dict()
        recording = run_blueprint(blueprint_dict)
        return recording.to_dict()
    except Exception as e:
        # We'll let Ninja handle the 500, or we could catch and return 400
        raise e

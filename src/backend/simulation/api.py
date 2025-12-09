from ninja import NinjaAPI, Schema
from typing import Dict, Any, List
from destiny_sim.builder.runner import get_registered_entities, run_blueprint

api = NinjaAPI(title="DEStiny Simulation API", version="0.1.0")

class Blueprint(Schema):
    simParams: Dict[str, Any] = {}
    entities: List[Dict[str, Any]] = []

@api.get("/schema", response=Dict[str, Dict[str, str]])
def get_schema(request):
    """
    Returns the entity schema for the frontend builder.
    """
    entities = get_registered_entities()
    schema = {}
    for name, cls in entities.items():
        # Schema is name -> {param -> type}
        schema[name] = cls.get_parameters_schema()
    return schema

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

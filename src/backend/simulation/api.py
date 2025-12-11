from ninja import NinjaAPI
from typing import List

from destiny_sim.builder.runner import get_registered_entities, run_blueprint
from destiny_sim.builder.schema import BuilderEntitySchema, Blueprint
from .schemas import (
    SimulationRecordingSchema,
)

api = NinjaAPI(title="DEStiny Simulation API", version="0.1.0")


@api.get("/schema", response=List[BuilderEntitySchema])
def get_schema(request):
    """
    Returns the entity schema for the frontend builder.
    """
    entities = get_registered_entities()
    return [cls.get_parameters_schema() for cls in entities.values()]

@api.post("/simulate", response=SimulationRecordingSchema)
def run_simulation(request, blueprint: Blueprint) -> SimulationRecordingSchema:
    """
    Runs a simulation blueprint and returns the recording.
    """
    try:
        # Use Blueprint object directly - no conversion needed
        recording = run_blueprint(blueprint)
        return SimulationRecordingSchema(**recording.to_dict())
    except Exception as e:
        # We'll let Ninja handle the 500, or we could catch and return 400
        raise e

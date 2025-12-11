from ninja import NinjaAPI
from typing import List

from destiny_sim.builder.runner import get_registered_entities, run_blueprint
from destiny_sim.builder.schema import BuilderEntitySchema, Blueprint
from destiny_sim.core.timeline import SimulationRecording

api = NinjaAPI(title="DEStiny Simulation API", version="0.1.0")


@api.get("/schema", response=List[BuilderEntitySchema])
def get_schema(request):
    """
    Returns the entity schema for the frontend builder.
    """
    entities = get_registered_entities()
    return [cls.get_parameters_schema() for cls in entities.values()]

@api.post("/simulate", response=SimulationRecording, by_alias=True)
def run_simulation(request, blueprint: Blueprint) -> SimulationRecording:
    """
    Runs a simulation blueprint and returns the recording.
    """
    try:
        recording = run_blueprint(blueprint)
        return recording
    except Exception as e:
        # We'll let Ninja handle the 500, or we could catch and return 400
        raise e

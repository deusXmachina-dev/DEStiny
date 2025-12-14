from typing import List, Optional

from django.http import HttpRequest
from destiny_sim.builder.runner import get_registered_entities, run_blueprint
from destiny_sim.builder.schema import Blueprint, BuilderEntitySchema
from destiny_sim.core.timeline import SimulationRecording
from ninja import Router

from agent.storage import BlueprintStorage

router = Router()


@router.get("/schema", response=List[BuilderEntitySchema])
def get_schema(request):
    """
    Returns the entity schema for the frontend builder.
    """
    entities = get_registered_entities()
    return [cls.get_parameters_schema() for cls in entities.values()]

@router.post("/simulate", response=SimulationRecording, by_alias=True)
def run_simulation(request: HttpRequest, blueprint: Optional[Blueprint] = None) -> SimulationRecording:
    """
    Runs a simulation using the provided blueprint or the one stored in session.
    
    Args:
        request: Django HTTP request
        blueprint: Optional blueprint to use. If not provided, uses session-stored blueprint.
    
    Returns:
        SimulationRecording with the simulation results
    """
    if blueprint is None:
        storage = BlueprintStorage(session=request.session)
        blueprint = storage.get_blueprint()
    
    try:
        recording = run_blueprint(blueprint)
        return recording
    except Exception as e:
        # We'll let Ninja handle the 500, or we could catch and return 400
        raise e

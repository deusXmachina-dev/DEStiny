from django.http import HttpRequest
from ninja import Router

from agent.storage import BlueprintStorage
from destiny_sim.builder.schema import Blueprint

router = Router()


@router.get("", response=Blueprint, by_alias=True)
def get_blueprint(request: HttpRequest) -> Blueprint:
    """
    Get the current blueprint from storage.
    
    Returns the blueprint stored in the session, or an empty blueprint if none exists.
    """
    storage = BlueprintStorage(session=request.session)
    return storage.get_blueprint()


@router.put("", response=Blueprint, by_alias=True)
def put_blueprint(request: HttpRequest, blueprint: Blueprint) -> Blueprint:
    """
    Update the current blueprint in storage.
    
    Saves the provided blueprint to the session storage.
    
    Args:
        blueprint: The blueprint to save
        
    Returns:
        The saved blueprint
    """
    storage = BlueprintStorage(session=request.session)
    storage.save_blueprint(blueprint)
    return blueprint

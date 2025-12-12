from django.http import HttpRequest
from ninja import Router

from agent.storage import BlueprintStorage
from destiny_sim.builder.schema import Blueprint, CanvasSize

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


@router.post("/canvas-size", response={200: None}, by_alias=True)
def post_canvas_size(request: HttpRequest, canvas_size: CanvasSize) -> None:
    """
    Update the canvas size in storage.
    
    Saves the provided canvas size to the session storage.
    """ 
    storage = BlueprintStorage(session=request.session)
    blueprint = storage.get_blueprint()
    blueprint.simParams.canvasSize = canvas_size
    storage.save_blueprint(blueprint)
    return None

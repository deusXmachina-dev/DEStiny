import json
from http import HTTPStatus

from django.http import JsonResponse, StreamingHttpResponse, HttpRequest
from ninja import Router
from pydantic import ValidationError

from agent import blueprint_agent
from agent.storage import BlueprintStorage
from pydantic_ai.ui import SSE_CONTENT_TYPE
from pydantic_ai.ui.vercel_ai import VercelAIAdapter

router = Router()


@router.post("")
async def chat(request: HttpRequest):
    accept = request.headers.get("accept", SSE_CONTENT_TYPE)

    try:
        # Django gives you raw bytes in request.body (same thing you used in FastAPI)
        run_input = VercelAIAdapter.build_run_input(request.body)
    except ValidationError as e:
        # e.json() is a JSON string; return it as proper JSON with status 422
        return JsonResponse(
            data=json.loads(e.json()),
            status=HTTPStatus.UNPROCESSABLE_ENTITY,
        )

    # Create storage instance with Django session
    storage = BlueprintStorage(session=request.session)

    adapter = VercelAIAdapter(agent=blueprint_agent, run_input=run_input, accept=accept)

    # adapter.run_stream() produces events; adapter.encode_stream(...) yields SSE bytes/chunks
    # Pass storage as dependency
    event_stream = adapter.run_stream(deps=storage)
    sse_event_stream = adapter.encode_stream(event_stream)

    resp = StreamingHttpResponse(sse_event_stream, content_type=accept)
    # SSE generally wants this to prevent buffering by proxies
    resp["Cache-Control"] = "no-cache"
    return resp
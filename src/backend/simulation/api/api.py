from ninja import NinjaAPI

from .blueprint import router as blueprint_router
from .chat import router as chat_router
from .simulation import router as simulation_router


api = NinjaAPI(
    title="DEStiny Simulation API",
    version="0.1.0",
    # django ninja adds csrf to session/cookie auth by default
    auth=None,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

api.add_router("/", simulation_router)
api.add_router("/chat", chat_router)
api.add_router("/blueprint", blueprint_router)
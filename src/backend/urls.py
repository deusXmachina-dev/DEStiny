from django.urls import path
from simulation.api import api

urlpatterns = [
    path("api/", api.urls),
]

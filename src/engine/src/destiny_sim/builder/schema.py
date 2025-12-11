"""
Schema definitions for builder entities and blueprints.
"""

from enum import StrEnum
from typing import Dict, List

from pydantic import BaseModel

from destiny_sim.core.rendering import SimulationEntityType


class ParameterType(StrEnum):
    """Allowed primitive parameter types for builder entities."""

    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"


ParameterValue = str | int | float | bool


class BuilderEntitySchema(BaseModel):
    """Schema for a builder entity definition."""

    entityType: SimulationEntityType
    parameters: Dict[str, ParameterType]


class SimParams(BaseModel):
    """Simulation-level parameters shared between frontend and engine."""

    initialTime: float | None = None
    duration: float | None = None


class BlueprintEntity(BaseModel):
    """Single entity instance in a simulation blueprint."""

    entityType: SimulationEntityType
    uuid: str
    parameters: Dict[str, ParameterValue]


class Blueprint(BaseModel):
    """
    Simulation blueprint used by the engine.

    This mirrors the structure expected by destiny_sim.builder.runner.run_blueprint
    and by the frontend builder feature.
    """

    simParams: SimParams = SimParams()
    entities: List[BlueprintEntity] = []

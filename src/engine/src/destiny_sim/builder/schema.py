"""
Schema definitions for builder entities.
"""

from enum import StrEnum
from typing import Dict

from pydantic import BaseModel

from destiny_sim.core.rendering import SimulationEntityType


class ParameterType(StrEnum):
    """Allowed primitive parameter types for builder entities."""

    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"


class BuilderEntitySchema(BaseModel):
    """Schema for a builder entity definition."""

    entityType: SimulationEntityType
    parameters: Dict[str, ParameterType]

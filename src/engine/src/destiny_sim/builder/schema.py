"""
Schema definitions for builder entities and blueprints.
"""

from enum import StrEnum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from destiny_sim.core.rendering import SimulationEntityType


class ParameterType(StrEnum):
    """Allowed primitive parameter types for builder entities."""

    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    ENTITY = "entity"


ParameterValue = str | int | float | bool


class BlueprintParameterType(StrEnum):
    """Parameter type for blueprint entity parameters."""

    PRIMITIVE = "primitive"
    ENTITY = "entity"


class BlueprintEntityParameter(BaseModel):
    """Single parameter for a blueprint entity."""

    name: str = Field(..., description="The name of the parameter")
    parameterType: BlueprintParameterType = Field(..., description="PRIMITIVE or ENTITY")
    value: ParameterValue = Field(
        ...,
        description="The parameter value (primitive value or UUID string for entities)",
    )


class ParameterInfo(BaseModel):
    """
    Information about a parameter, including its name, type and optional constraints.
    
    This allows for richer parameter definitions beyond just the type,
    such as filtering allowed entity types for entity parameters.
    """

    name: str = Field(..., description="The name of the parameter")
    type: ParameterType = Field(..., description="The type of the parameter")
    allowedEntityTypes: Optional[List[SimulationEntityType]] = Field(
        None,
        description=(
            "For ENTITY type parameters, optionally restrict which entity types "
            "are valid. If None, all entity types are allowed."
        ),
    )


class BuilderEntitySchema(BaseModel):
    """Schema for a builder entity definition."""

    entityType: SimulationEntityType
    parameters: Dict[str, ParameterInfo]


class SimParams(BaseModel):
    """Simulation-level parameters shared between frontend and engine."""

    initialTime: float = 0
    duration: float | None = None


class BlueprintEntity(BaseModel):
    """Single entity instance in a simulation blueprint."""

    entityType: SimulationEntityType
    uuid: str
    name: str = Field(..., description="Entity name")
    parameters: Dict[str, BlueprintEntityParameter]


class Blueprint(BaseModel):
    """
    Simulation blueprint used by the engine.

    This mirrors the structure expected by destiny_sim.builder.runner.run_blueprint
    and by the frontend builder feature.
    """

    simParams: SimParams = SimParams()
    entities: List[BlueprintEntity] = []

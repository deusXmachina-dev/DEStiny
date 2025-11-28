"""
Defines snapshot data structures for simulation components.
"""
from dataclasses import dataclass, field


@dataclass(frozen=True)
class ComponentSnapshot:
    """
    A simple snapshot implementation containing basic positional and rendering information.

    Attributes:
        type: Type of the component.
        x: X-coordinate position.
        y: Y-coordinate position.
        angle: Angle in radians.
        children: List of child component snapshots.
        id: Unique identifier of the component.
    """
    type: str
    x: float
    y: float
    angle: float
    children: list["ComponentSnapshot"] = field(default_factory=list)
    id: str = ""


@dataclass(frozen=True)
class SimulationSnapshot:
    """
    Represents the state of the entire simulation at a specific point in time.

    Attributes:
        time: The simulation time.
        components: List of top-level component snapshots.
    """
    time: float
    components: list[ComponentSnapshot]

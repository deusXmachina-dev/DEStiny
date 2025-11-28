"""
Defines the base container class for simulation entities.
"""
from abc import abstractmethod, ABC
import dataclasses
import uuid
from typing import List

from destiny.core.snapshot import ComponentSnapshot


class SimulationContainer(ABC):
    """
    Base class for any component participating in simulation that can hold children
    and be rendered.
    """

    def __init__(self):
        """
        Initialize the simulation container.
        """
        self.id: str = str(uuid.uuid4())
        self._children: List["SimulationContainer"] = []

    def add_child(self, child: "SimulationContainer") -> None:
        """
        Add a child component to this container.
        Child components will be automatically included in the snapshot hierarchy.
        """
        if child not in self._children:
            self._children.append(child)

    def remove_child(self, child: "SimulationContainer") -> None:
        """
        Remove a child component from this container.
        """
        if child in self._children:
            self._children.remove(child)

    def snapshot(self, t: float) -> ComponentSnapshot | None:
        """
        Return a snapshot of the component's current state
        suitable for GUI rendering.
        Must NOT modify simulation state.

        Args:
            t: The simulation time at which to take the snapshot.

        Returns:
            A snapshot of the component's current state suitable for GUI rendering.
            If the component is not to be rendered at the given time, returns None.
        """
        # Get the component's own state
        snapshot = self._get_snapshot_state(t)
        if snapshot is None:
            return None

        # Collect snapshots from children
        child_snapshots = []
        for child in self._children:
            child_snapshot = child.snapshot(t)
            if child_snapshot:
                child_snapshots.append(child_snapshot)

        # Always ensure ID is set to the container's ID
        # If there are children snapshots, update the main snapshot children as well
        changes = {"id": self.id}
        if child_snapshots:
            changes["children"] = snapshot.children + child_snapshots
        
        return dataclasses.replace(snapshot, **changes)

    @abstractmethod
    def _get_snapshot_state(self, t: float) -> ComponentSnapshot | None:
        """
        Return the basic snapshot state for this component.
        Subclasses must implement this to provide their specific state (x, y, angle, type).
        The 'children' field can be empty and will be populated by the base class.
        """
        pass


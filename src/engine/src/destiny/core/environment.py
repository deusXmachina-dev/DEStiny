"""
Core environment module for the simulation.
"""
from collections.abc import Iterator

from simpy import RealtimeEnvironment

from destiny.core.simulation_container import SimulationContainer
from destiny.core.snapshot import ComponentSnapshot, SimulationSnapshot


class TickingEnvironment(RealtimeEnvironment, SimulationContainer):
    """
    A simulation environment that advances in discrete ticks and captures snapshots.

    This environment extends simpy.RealtimeEnvironment to support periodic ticking
    mechanisms, useful for synchronization with external systems or UI rendering.
    It also acts as the root SimulationContainer.
    """

    def __init__(self, tick_interval: float = 1.0, initial_time: float = 0, factor: float = 1.0):
        """
        Initialize the TickingEnvironment.

        Args:
            tick_interval: The simulation time duration between ticks.
            initial_time: The starting simulation time.
            factor: Real-time scaling factor (e.g. 1.0 = real time, 0.1 = fast).
        """
        RealtimeEnvironment.__init__(self, initial_time=initial_time, factor=factor, strict=False)
        SimulationContainer.__init__(self)
        self.tick_interval = tick_interval

        self.last_tick_time = initial_time

    def advance(self) -> SimulationSnapshot:
        """
        Advance the simulation by one tick interval and capture snapshots.

        Returns:
            A snapshot of the entire simulation at the new time.
        """
        time_to_advance = self.last_tick_time + self.tick_interval
        self.run(until=time_to_advance)
        self.last_tick_time = time_to_advance
        return SimulationSnapshot(time=self.now, components=self._take_snapshots())

    def iterate(self, until: float) -> Iterator[SimulationSnapshot]:
        """
        Iterator that yields snapshots by advancing the environment until the specified time.

        Args:
            until: The simulation time to run until.
            
        Yields:
            A snapshot of the entire simulation at each tick.
        """
        while self.now < until:
            yield self.advance()

    def _take_snapshots(self) -> list[ComponentSnapshot]:
        snapshots = []
        for component in self._children:
            snap = component.snapshot(self.now)
            if snap is not None:
                snapshots.append(snap)
        return snapshots

    def _get_snapshot_state(self, t: float) -> ComponentSnapshot | None:
        """
        The environment itself does not render as a component.
        """
        return None

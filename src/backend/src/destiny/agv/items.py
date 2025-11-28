from destiny.core.simulation_container import SimulationContainer
from destiny.core.snapshot import ComponentSnapshot


class Box(SimulationContainer):
    def _get_snapshot_state(self, t: float) -> ComponentSnapshot | None:
        return ComponentSnapshot(
            type="box",
            x=0,
            y=0,
            angle=0
        )


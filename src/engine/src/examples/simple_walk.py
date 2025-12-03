"""
Minimal DEStiny example - one person moving from A to B to C.
"""

from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity

DURATION = 5


class Person(SimulationEntity):
    def __init__(self, x: float, y: float):
        super().__init__()
        self._x = x
        self._y = y

    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.HUMAN)

    def walk_sequence(self, env: RecordingEnvironment):
        yield from self._walk_to(env, 500.0, 300.0)
        yield from self._walk_to(env, 800.0, 100.0)

    def _walk_to(self, env: RecordingEnvironment, target_x: float, target_y: float):
        """Move from current position to target position."""

        env.record_motion(
            self,
            end_time=env.now + DURATION,
            start_x=self._x,
            start_y=self._y,
            end_x=target_x,
            end_y=target_y,
        )

        self._x = target_x
        self._y = target_y
        yield env.timeout(DURATION)


def main():
    env = RecordingEnvironment()

    person = Person(x=100.0, y=100.0)
    env.process(person.walk_sequence(env))

    env.run()
    env.save_recording("simulation-records/simple_walk_recording.json")


if __name__ == "__main__":
    main()

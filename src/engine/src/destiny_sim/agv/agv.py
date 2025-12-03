"""
AGV (Automated Guided Vehicle) simulation entity.
"""

from collections import deque
from typing import Any, Generator

from simpy import Timeout

from destiny_sim.agv.location import Location
from destiny_sim.agv.planning import TripPlan, WaypointType
from destiny_sim.agv.store_location import StoreLocation
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity


class AGV(SimulationEntity):
    """
    An Automated Guided Vehicle that moves along planned paths.
    """

    def __init__(
        self, env: RecordingEnvironment, start_location: Location, speed: float = 1.0
    ):
        super().__init__()
        self._speed: float = speed
        self._is_available = True
        self._plan_queue: deque[TripPlan] = deque()
        self._carried_item: Any | None = None
        self._current_location: Location = start_location
        self._planned_destination: Location = start_location
        self._angle: float = 0.0

        env.record_stay(
            entity=self, x=self._current_location.x, y=self._current_location.y
        )

    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.AGV)

    def schedule_plan(self, env: RecordingEnvironment, plan: TripPlan) -> None:
        """Schedule a plan for the AGV to execute."""
        self._planned_destination = plan[-1].location
        self._plan_queue.append(plan)

        if self._is_available:
            self._is_available = False
            env.process(self._process_queue(env))

    def _process_queue(
        self, env: RecordingEnvironment
    ) -> Generator[Timeout | Any, Any, None]:
        """Process all queued plans."""
        while self._plan_queue:
            plan = self._plan_queue.popleft()
            yield from self._execute_plan(env, plan)
        self._is_available = True

    def _execute_plan(
        self, env: RecordingEnvironment, plan: TripPlan
    ) -> Generator[Timeout | Any, Any, None]:
        """Execute a single plan, recording motion segments."""

        for waypoint in plan:
            start_time = env.now
            start_location = self._current_location
            end_location = waypoint.location

            new_angle = start_location.angle_to(end_location)
            end_angle = new_angle if new_angle is not None else self._angle
            self._angle = end_angle  # update to face next destination

            # Calculate duration
            distance = start_location.distance_to(end_location)
            duration = distance / self._speed if distance > 0 else 0
            end_time = start_time + duration

            # Record motion for AGV
            env.record_motion(
                entity=self,
                start_time=start_time,
                end_time=end_time,
                start_x=start_location.x,
                start_y=start_location.y,
                end_x=end_location.x,
                end_y=end_location.y,
                start_angle=end_angle,
                end_angle=end_angle,
            )

            # If carrying an item, stay put relative to AGV
            env.record_stay(
                entity=self._carried_item,
                start_time=start_time,
                end_time=end_time,
                parent=self,
            )

            # Wait for the movement to complete
            if duration > 0:
                yield env.timeout(duration)

            self._current_location = end_location

            # Handle pickup at SOURCE
            if (
                isinstance(source := waypoint.location, StoreLocation)
                and waypoint.type == WaypointType.SOURCE
            ):
                self._carried_item = yield source.get_item()

            # Handle drop at SINK
            if (
                isinstance(sink := waypoint.location, StoreLocation)
                and waypoint.type == WaypointType.SINK
            ):
                yield sink.put_item(self._carried_item)
                self._carried_item = None

                env.record_stay(
                    entity=self,
                    start_time=end_time,
                    x=end_location.x,
                    y=end_location.y,
                    angle=end_angle,
                )

    def is_available(self) -> bool:
        return self._is_available

    @property
    def planned_destination(self) -> Location:
        return self._planned_destination

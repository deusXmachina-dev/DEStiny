
from collections import deque
from typing import Any, Generator

from simpy import Timeout

from destiny.agv.location import Location
from destiny.agv.planning import TripPlan, WaypointType
from destiny.agv.store_location import StoreLocation
from destiny.core.simulation_container import SimulationContainer
from destiny.core.environment import TickingEnvironment
from destiny.core.snapshot import ComponentSnapshot


class AGV(SimulationContainer):
    def __init__(self, start_location: Location, speed: float = 1.0):
        super().__init__()

        self._speed: float = speed # units/s

        self._is_available = True
        self._plan_queue: deque[TripPlan] = deque()
        self._carried_item: Any | None = None  # todo: consider generics or adding interface for items

        self._start_time: float = 0.0
        self._start_location: Location = start_location
        self._end_location: Location = start_location
        
        self._planned_destination: Location = start_location
        self._angle: float = 0.0

    def _get_snapshot_state(self, t: float) -> None | ComponentSnapshot:
        if self._start_time is None or self._start_location is None or self._end_location is None:
            return None

        time_elapsed = t - self._start_time
        distance_traveled = time_elapsed * self._speed
        current_location = self._start_location.move_towards(self._end_location, distance_traveled)
        angle = self._start_location.angle_to(self._end_location)
        if angle is not None:
            self._angle = angle

        return ComponentSnapshot(
            type="AGV",
            x=current_location.x,
            y=current_location.y,
            angle=self._angle
        )

    def schedule_plan(self, env: TickingEnvironment, plan: TripPlan) -> None:
        self._planned_destination = plan[-1].location
        self._plan_queue.append(plan)

        if self._is_available:
            self._is_available = False
            env.process(self._process_queue(env))

    def _process_queue(self, env: TickingEnvironment) -> Generator[Timeout | Any, Any, None]:
        while self._plan_queue:
            plan = self._plan_queue.popleft()
            yield from self._execute_plan(env, plan)
        self._is_available = True

    def _execute_plan(self, env: TickingEnvironment, plan: TripPlan) -> Generator[Timeout | Any, Any, None]:
        
        for waypoint in plan:

            self._start_time = env.now
            self._start_location = self._end_location
            self._end_location = waypoint.location

            duration = self._leg_duration()
            yield env.timeout(duration)

            if isinstance(source := waypoint.location, StoreLocation) and waypoint.type == WaypointType.SOURCE:
                self._carried_item = yield source.get_item()
                if isinstance(self._carried_item, SimulationContainer):
                    self.add_child(self._carried_item)

            if isinstance(sink := waypoint.location, StoreLocation) and waypoint.type == WaypointType.SINK:
                if isinstance(self._carried_item, SimulationContainer):
                    self.remove_child(self._carried_item)
                yield sink.put_item(self._carried_item)
                self._carried_item = None

    def _leg_distance(self) -> float:
        return self._start_location.distance_to(self._end_location)

    def _leg_duration(self) -> float:   
        return self._leg_distance() / self._speed

    def is_available(self) -> bool:
        return self._is_available

    @property
    def planned_destination(self) -> Location:
        return self._planned_destination

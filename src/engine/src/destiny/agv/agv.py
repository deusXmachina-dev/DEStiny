"""
AGV (Automated Guided Vehicle) simulation entity.
"""
from collections import deque
from typing import Any, Generator

from simpy import Timeout

from destiny.agv.location import Location
from destiny.agv.planning import TripPlan, WaypointType
from destiny.agv.store_location import StoreLocation
from destiny.core.simulation_container import SimulationEntity
from destiny.core.environment import Environment


class AGV(SimulationEntity):
    """
    An Automated Guided Vehicle that moves along planned paths.
    """
    
    def __init__(self, start_location: Location, speed: float = 1.0):
        super().__init__()
        self._speed: float = speed
        self._is_available = True
        self._plan_queue: deque[TripPlan] = deque()
        self._carried_item: Any | None = None
        self._current_location: Location = start_location
        self._planned_destination: Location = start_location
        self._angle: float = 0.0
        self._has_initial_motion: bool = False

    def _get_entity_type(self) -> str:
        return "agv"

    def schedule_plan(self, env: Environment, plan: TripPlan) -> None:
        """Schedule a plan for the AGV to execute."""
        # Record initial static position if this is the first plan
        if not self._has_initial_motion:
            env.record_motion(
                entity=self,
                start_time=env.now,
                end_time=env.now,  # Zero duration - just establishes initial position
                start_x=self._current_location.x,
                start_y=self._current_location.y,
                end_x=self._current_location.x,
                end_y=self._current_location.y,
                start_angle=self._angle,
                end_angle=self._angle,
            )
            self._has_initial_motion = True
        
        self._planned_destination = plan[-1].location
        self._plan_queue.append(plan)

        if self._is_available:
            self._is_available = False
            env.process(self._process_queue(env))

    def _process_queue(self, env: Environment) -> Generator[Timeout | Any, Any, None]:
        """Process all queued plans."""
        while self._plan_queue:
            plan = self._plan_queue.popleft()
            yield from self._execute_plan(env, plan)
        self._is_available = True

    def _execute_plan(self, env: Environment, plan: TripPlan) -> Generator[Timeout | Any, Any, None]:
        """Execute a single plan, recording motion segments."""
        
        for waypoint in plan:
            start_time = env.now
            start_location = self._current_location
            end_location = waypoint.location
            
            # Calculate angle for this leg
            new_angle = start_location.angle_to(end_location)
            start_angle = self._angle
            if new_angle is not None:
                end_angle = new_angle
                self._angle = new_angle
            else:
                end_angle = self._angle
            
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
                start_angle=start_angle,
                end_angle=end_angle,
            )
            
            # If carrying an item, record its motion relative to AGV
            if isinstance(self._carried_item, SimulationEntity):
                env.record_motion(
                    entity=self._carried_item,
                    parent=self,  # Relative to AGV
                    start_time=start_time,
                    end_time=end_time,
                    start_x=0,
                    start_y=0,
                    end_x=0,
                    end_y=0,
                    start_angle=0,
                    end_angle=0,
                )
            
            # Wait for the movement to complete
            if duration > 0:
                yield env.timeout(duration)
            
            self._current_location = end_location

            # Handle pickup at SOURCE
            if isinstance(source := waypoint.location, StoreLocation) and waypoint.type == WaypointType.SOURCE:
                self._carried_item = yield source.get_item()

            # Handle drop at SINK
            if isinstance(sink := waypoint.location, StoreLocation) and waypoint.type == WaypointType.SINK:
                # Record box at its final absolute position (no parent)
                if isinstance(self._carried_item, SimulationEntity):
                    env.record_motion(
                        entity=self._carried_item,
                        parent=None,  # Now in world space
                        start_time=env.now,
                        end_time=None,  # Until simulation end
                        start_x=sink.x,
                        start_y=sink.y,
                        end_x=sink.x,
                        end_y=sink.y,
                    )
                yield sink.put_item(self._carried_item)
                self._carried_item = None

    def is_available(self) -> bool:
        return self._is_available

    @property
    def planned_destination(self) -> Location:
        return self._planned_destination

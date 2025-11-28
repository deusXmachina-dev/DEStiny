import random
from typing import Any, Generator

from simpy import Event

from destiny.agv.agv import AGV
from destiny.agv.planning import AGVTask, TripPlan, Waypoint, WaypointType
from destiny.agv.site_graph import SiteGraph
from destiny.agv.store_location import StoreLocation
from destiny.core.environment import TickingEnvironment
from destiny.core.simulation_container import SimulationContainer
from destiny.core.snapshot import ComponentSnapshot


class FleetManager(SimulationContainer):
    """
    A fleet manager that schedules plans for AGVs based on the task provider.
    Note: this is a very rudimentary implementation and does not do:
    - collision avoidance
    - load balancing
    - window scheduling
    - etc.

    Args:
        task_provider: The task provider that provides the next task.
        site_graph: The site graph that the AGVs will navigate.
    """

    def __init__(self, task_provider: TaskProvider, site_graph: SiteGraph):
        super().__init__()

        self._task_provider = task_provider
        self._site_graph = site_graph

    @property
    def agvs(self) -> list[AGV]:
        return [child for child in self._children if isinstance(child, AGV)]

    def _get_snapshot_state(self, t: float) -> ComponentSnapshot | None:
        return None

    def plan_indefinitely(self, env: TickingEnvironment) -> Generator[Event, Any, Any]:
        while True:

            new_task = yield env.process(self._task_provider.get_next_task(env))

            assigned_agv = self._find_best_agv_for_task(new_task)
            self._schedule_plan(env, assigned_agv, new_task)

    def _find_best_agv_for_task(self, _task: AGVTask) -> AGV:

        taskless_agvs = [agv for agv in self.agvs if agv.is_available()]

        if len(taskless_agvs) == 0:
            return random.choice(self.agvs)

        else:
            return random.choice(taskless_agvs)

    def _schedule_plan(self, env: TickingEnvironment, agv: AGV, task: AGVTask) -> None:
        path_to_source = self._site_graph.shortest_path(agv.planned_destination, task.source)
        path_to_sink = self._site_graph.shortest_path(task.source, task.sink)

        waypoints = []

        if path_to_source:
            # Skip first (current location)
            for loc in path_to_source[1:-1]:
                waypoints.append(Waypoint(loc, WaypointType.PASS))
            # Add source
            waypoints.append(Waypoint(path_to_source[-1], WaypointType.SOURCE))

        if path_to_sink:
            # Skip first (source, already added)
            for loc in path_to_sink[1:-1]:
                waypoints.append(Waypoint(loc, WaypointType.PASS))
            # Add sink
            waypoints.append(Waypoint(path_to_sink[-1], WaypointType.SINK))

        plan = TripPlan(waypoints)
        agv.schedule_plan(env, plan)


class TaskProvider:
    
    def __init__(self, sources: list[StoreLocation], sinks: list[StoreLocation]):
        self._sources = sources
        self._sinks = sinks

    def get_next_task(self, env: TickingEnvironment) -> Generator[Event, Any, AGVTask]:
        yield env.timeout(20) # todo: implement actual logic for getting the next task
        return AGVTask(source=random.choice(self._sources), sink=random.choice(self._sinks))

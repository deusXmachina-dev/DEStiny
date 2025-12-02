"""
Fleet manager for coordinating AGVs.
"""
import random
from typing import Any, Generator

from simpy import Event

from destiny.agv.agv import AGV
from destiny.agv.planning import AGVTask, TripPlan, Waypoint, WaypointType
from destiny.agv.site_graph import SiteGraph
from destiny.agv.store_location import StoreLocation
from destiny.core.environment import Environment


class TaskProvider:
    """Provides tasks for AGVs to execute."""
    
    def __init__(self, sources: list[StoreLocation], sinks: list[StoreLocation]):
        self._sources = sources
        self._sinks = sinks

    def get_next_task(self, env: Environment) -> Generator[Event, Any, AGVTask]:
        yield env.timeout(10)
        return AGVTask(source=random.choice(self._sources), sink=random.choice(self._sinks))


class FleetManager:
    """
    Coordinates AGVs to execute tasks.
    
    Note: This is a simple implementation without collision avoidance,
    load balancing, or advanced scheduling.
    """

    def __init__(self, task_provider: TaskProvider, site_graph: SiteGraph):
        self._task_provider = task_provider
        self._site_graph = site_graph
        self._agvs: list[AGV] = []

    def add_agv(self, agv: AGV) -> None:
        """Add an AGV to the fleet."""
        self._agvs.append(agv)

    @property
    def agvs(self) -> list[AGV]:
        return self._agvs

    def plan_indefinitely(self, env: Environment) -> Generator[Event, Any, Any]:
        """Continuously assign tasks to available AGVs."""
        while True:
            new_task = yield env.process(self._task_provider.get_next_task(env))
            assigned_agv = self._find_best_agv_for_task(new_task)
            self._schedule_plan(env, assigned_agv, new_task)

    def _find_best_agv_for_task(self, _task: AGVTask) -> AGV:
        taskless_agvs = [agv for agv in self._agvs if agv.is_available()]
        if len(taskless_agvs) == 0:
            return random.choice(self._agvs)
        return random.choice(taskless_agvs)

    def _schedule_plan(self, env: Environment, agv: AGV, task: AGVTask) -> None:
        path_to_source = self._site_graph.shortest_path(agv.planned_destination, task.source)
        path_to_sink = self._site_graph.shortest_path(task.source, task.sink)

        waypoints = []

        if path_to_source:
            for loc in path_to_source[1:-1]:
                waypoints.append(Waypoint(loc, WaypointType.PASS))
            waypoints.append(Waypoint(path_to_source[-1], WaypointType.SOURCE))

        if path_to_sink:
            for loc in path_to_sink[1:-1]:
                waypoints.append(Waypoint(loc, WaypointType.PASS))
            waypoints.append(Waypoint(path_to_sink[-1], WaypointType.SINK))

        plan = TripPlan(waypoints)
        agv.schedule_plan(env, plan)

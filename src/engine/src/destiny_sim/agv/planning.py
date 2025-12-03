from dataclasses import dataclass
from enum import Enum
from typing import Iterable, Iterator

from destiny_sim.agv.location import Location
from destiny_sim.agv.store_location import StoreLocation


class WaypointType(Enum):
    SOURCE = "source"
    SINK = "sink"
    PASS = "pass"


@dataclass(frozen=True)
class Waypoint:
    location: Location
    type: WaypointType


class TripPlan(Iterable[Waypoint]):
    def __init__(self, waypoints: Iterable[Waypoint]):
        self._waypoints = list(waypoints)

    def __iter__(self) -> Iterator[Waypoint]:
        return iter(self._waypoints)

    def __len__(self) -> int:
        return len(self._waypoints)

    def __getitem__(self, index: int) -> Waypoint:
        return self._waypoints[index]

    def __setitem__(self, index: int, value: Waypoint):
        self._waypoints[index] = value

    def append(self, waypoint: Waypoint):
        self._waypoints.append(waypoint)


class AGVTask:
    def __init__(self, source: StoreLocation, sink: StoreLocation):
        self.source = source
        self.sink = sink

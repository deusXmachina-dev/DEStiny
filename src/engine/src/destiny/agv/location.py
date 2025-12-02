import math
from dataclasses import dataclass


@dataclass
class Location:
    x: float
    y: float

    def distance_to(self, other: 'Location') -> float:
        return math.hypot(self.x - other.x, self.y - other.y)

    def angle_to(self, other: 'Location') -> float | None:
        if self == other:
            return None
        return math.atan2(other.y - self.y, other.x - self.x)

    def move_towards(
        self, other: 'Location', distance: float, clip: bool = True
    ) -> 'Location':
        dist_total = self.distance_to(other)
        
        if dist_total == 0:
            return self

        ratio = distance / dist_total

        if clip:
            ratio = min(ratio, 1.0)

        return Location(
            x=self.x + ratio * (other.x - self.x),
            y=self.y + ratio * (other.y - self.y)
        )

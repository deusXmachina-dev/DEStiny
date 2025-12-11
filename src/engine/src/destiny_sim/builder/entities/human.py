"""
Human entity for simulation.
"""

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType


class Human(BuilderEntity):
    """
    A simple human entity that walks from a starting position to a target.
    """
    
    entity_type = "human"
    icon = "/assets/human.png"

    def __init__(
        self, 
        x: float, 
        y: float, 
        targetX: float, 
        targetY: float
    ):
        super().__init__()
        self.x = x
        self.y = y
        self.target_x = targetX
        self.target_y = targetY

    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.HUMAN)

    def process(self, env: RecordingEnvironment):
        """
        Walks from (x, y) to (targetX, targetY).
        """
        speed = 50.0  # pixels per second (example constant)

        # Calculate distance
        dx = self.target_x - self.x
        dy = self.target_y - self.y
        dist = (dx**2 + dy**2) ** 0.5

        if dist > 0:
            
            # Record motion
            # Note: record_motion yields a Timeout event equal to the duration
            yield env.record_motion(
                entity=self,
                start_time=env.now,
                speed=speed,
                start_x=self.x,
                start_y=self.y,
                end_x=self.target_x,
                end_y=self.target_y,
            )

            # Update position
            self.x = self.target_x
            self.y = self.target_y

            # Stay at destination indefinitely
            env.record_stay(self, x=self.x, y=self.y)

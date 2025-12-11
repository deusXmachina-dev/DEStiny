"""
ManufacturingCell entity for simulation.
"""

import numpy as np

from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.builder.entities.material_flow.buffer import Buffer
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import SimulationEntityType


class ManufacturingCell(BuilderEntity):
    """
    A manufacturing cell that processes items from an input buffer to an output buffer.
    Uses a lognormal distribution for manufacturing duration.
    """
    
    entity_type = SimulationEntityType.MANUFACTURING_CELL

    def __init__(
        self,
        x: float,
        y: float,
        buffer_in: Buffer,
        buffer_out: Buffer,
        mean: float,
        std_dev: float,
    ):
        super().__init__()
        self.x = x
        self.y = y
        self.buffer_in = buffer_in
        self.buffer_out = buffer_out
        self.mean = mean
        self.std_dev = std_dev
        
    def process(self, env: RecordingEnvironment):
        """
        Main process: continuously get items from input buffer,
        process them (with lognormal duration), and put them in output buffer.
        """
        # Record stay at manufacturing cell position
        env.record_stay(self, x=self.x, y=self.y)

        while True:
            # Get item from input buffer
            item = yield self.buffer_in.get_item(env)
            
            # Calculate processing duration using lognormal distribution
            mu = np.log(self.mean**2 / np.sqrt(self.std_dev**2 + self.mean**2))
            sigma = np.sqrt(np.log(1 + self.std_dev**2 / self.mean**2))
            duration = np.random.lognormal(mean=mu, sigma=sigma)

            # Wait for processing duration
            yield env.timeout(duration)

            # Put item in output buffer
            yield self.buffer_out.put_item(env, item)

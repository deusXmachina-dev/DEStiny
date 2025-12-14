"""
ManufacturingCell entity for simulation.
"""

from enum import StrEnum
from typing import Union

import numpy as np

from destiny_sim.agv.items import Box
from destiny_sim.builder.entities.material_flow.buffer import Buffer
from destiny_sim.builder.entities.material_flow.control import Control
from destiny_sim.builder.entities.material_flow.sink import Sink
from destiny_sim.builder.entities.material_flow.source import Source
from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import SimulationEntityType

MAX_MATERIAL_FLOW_DURATION = 5.0
MANUFACTURING_CELL_STATE_METRIC = "Manufacturing Cell State"


class ManufacturingCellState(StrEnum):
    IDLE = "Idle"
    PROCESSING = "Processing"


class ManufacturingCell(BuilderEntity):
    """
    A manufacturing cell that processes items from an input buffer to an output buffer.
    Uses a lognormal distribution for manufacturing duration.
    """

    entity_type = SimulationEntityType.MANUFACTURING_CELL

    def __init__(
        self,
        name: str,
        x: float,
        y: float,
        input: Union[Buffer, Source],
        output: Union[Buffer, Sink, Control],
        mean: float,
        std_dev: float,
    ):
        super().__init__(name=name)
        self.x = x
        self.y = y
        self.input = input
        self.output = output
        self.mean = mean
        self.std_dev = std_dev

    def process(self, env: RecordingEnvironment):
        """
        Main process: continuously get items from input buffer,
        process them (with lognormal duration), and put them in output buffer.
        """
        # Record stay at manufacturing cell position
        env.record_stay(self, x=self.x, y=self.y)
        env.set_state(
            f"{MANUFACTURING_CELL_STATE_METRIC} {self.name}",
            ManufacturingCellState.IDLE,
        )

        while True:
            # Get item from input buffer
            item = yield self.input.get_item(env)

            # Set state to processing
            env.set_state(
                f"{MANUFACTURING_CELL_STATE_METRIC} {self.name}",
                ManufacturingCellState.PROCESSING,
            )

            # Calculate processing duration using lognormal distribution
            mu = np.log(self.mean**2 / np.sqrt(self.std_dev**2 + self.mean**2))
            sigma = np.sqrt(np.log(1 + self.std_dev**2 / self.mean**2))
            duration = np.random.lognormal(mean=mu, sigma=sigma)

            # Visualize material flow
            self._visualize_material_flow(env, duration)

            # Wait for processing duration
            yield env.timeout(duration)

            # Set state to idle
            env.set_state(
                f"{MANUFACTURING_CELL_STATE_METRIC} {self.name}",
                ManufacturingCellState.IDLE,
            )

            # Put item in output buffer
            yield self.output.put_item(env, item)

    def _visualize_material_flow(
        self, env: RecordingEnvironment, process_duration: float
    ):
        """
        Visualize material flow through the manufacturing cell.
        """
        flow_in_duration = min(process_duration / 2, MAX_MATERIAL_FLOW_DURATION)
        flow_out_duration = min(process_duration / 2, MAX_MATERIAL_FLOW_DURATION)

        processing_duration = process_duration - flow_in_duration - flow_out_duration

        box = Box()
        # Visualize material flow in
        env.record_motion(
            box,
            start_x=self.input.x,
            start_y=self.input.y,
            end_x=self.x,
            end_y=self.y,
            duration=flow_in_duration,
        )

        # Visualize processing
        env.record_stay(
            box,
            x=self.x,
            y=self.y,
            start_time=env.now + flow_in_duration,
            duration=processing_duration,
        )

        # Visualize material flow out
        env.record_motion(
            box,
            start_x=self.x,
            start_y=self.y,
            end_x=self.output.x,
            end_y=self.output.y,
            start_time=env.now + flow_in_duration + processing_duration,
            duration=flow_out_duration,
        )
        
        env.record_progress(self, duration=process_duration)

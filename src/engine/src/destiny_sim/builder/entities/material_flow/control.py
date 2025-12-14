"""
Control entity for simulation.
"""

import random
from typing import Any, Union

import simpy

from destiny_sim.agv.items import Box
from destiny_sim.builder.entities.material_flow.buffer import Buffer
from destiny_sim.builder.entities.material_flow.sink import Sink
from destiny_sim.builder.entity import BuilderEntity
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import SimulationEntityType

CONTROL_OK_ITEMS_METRIC = "OK items from control"
CONTROL_NOK_ITEMS_METRIC = "NOK items from control"


class Control(BuilderEntity):
    """
    A control entity that routes items to ok_output or nok_output based on nok_probability.
    Acts as a quality control station receiving items from manufacturing cells.
    """

    entity_type = SimulationEntityType.CONTROL

    def __init__(
        self,
        name: str,
        x: float,
        y: float,
        ok_output: Union[Buffer, Sink],
        nok_output: Sink,
        nok_probability: float,
    ):
        super().__init__(name=name)
        self.x = x
        self.y = y
        self.ok_output = ok_output
        self.nok_output = nok_output
        self.nok_probability = nok_probability

    def process(self, env: RecordingEnvironment):
        """
        Main process: record stay at control position.
        """
        yield env.record_stay(self, x=self.x, y=self.y)

    def put_item(self, env: RecordingEnvironment, item: Any) -> simpy.events.Event:
        """
        Accept an item and route it to ok_output or nok_output based on nok_probability.
        
        Args:
            env: The simulation environment
            item: The item to route
            
        Returns:
            SimPy event for the put_item operation
        """
        # Determine if item is NOK based on probability
        is_nok = random.random() < self.nok_probability
        
        # Select output based on result
        output = self.nok_output if is_nok else self.ok_output
        
        # Record metric
        if is_nok:
            env.incr_counter(f"{CONTROL_NOK_ITEMS_METRIC} {self.name}")
        else:
            env.incr_counter(f"{CONTROL_OK_ITEMS_METRIC} {self.name}")
        
        # Visualize material flow to selected output
        env.record_motion(
            Box(),
            start_x=self.x,
            start_y=self.y,
            end_x=output.x,
            end_y=output.y,
            duration=3,
        )
        
        # Route item to selected output
        return output.put_item(env, item)

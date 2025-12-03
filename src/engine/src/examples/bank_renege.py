"""
Bank renege example with destiny_sim visualization (Refactored)

Covers:
- Resources: Resource
- Condition events
- destiny_sim visualization (Encapsulated)

Scenario:
  A counter with a random service time and customers who renege. Based on the
  program bank08.py from TheBank tutorial of SimPy 2. (KGM)
"""

import math
import random
from dataclasses import dataclass

import simpy

from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity

# --- Configuration ---
RANDOM_SEED = 42
NEW_CUSTOMERS = 25
INTERVAL_CUSTOMERS = 10.0
MIN_PATIENCE = 1
MAX_PATIENCE = 3


@dataclass
class Config:
    counter_pos = (500, 100)
    source_pos = (100, 500)
    exit_pos = (900, 500)
    queue_pos = (500, 200)
    walk_speed = 100.0


# --- Entities ---


class BankCounter(SimulationEntity):
    def __init__(
        self,
        env: RecordingEnvironment,
        capacity: int = 1,
        x: float = 0.0,
        y: float = 0.0,
    ):
        super().__init__()
        self.env = env
        self.resource = simpy.Resource(env, capacity=capacity)
        self.x = x
        self.y = y
        # Record the counter's position at the start of the simulation
        env.record_stay(
            self,
            start_time=0,
            x=x,
            y=y,
        )

    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.COUNTER)


class BankCustomer(SimulationEntity):
    def __init__(self, env: RecordingEnvironment, name: str, speed: float = 100.0):
        super().__init__()
        self.env = env
        self.name = name
        self.speed = speed
        self.x = 0.0
        self.y = 0.0

    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.HUMAN)

    def set_position(self, x: float, y: float):
        self.x = x
        self.y = y
        # Record initial appearance or teleport
        self.env.record_stay(self, start_time=self.env.now, x=x, y=y)

    def walk_to(self, target_x: float, target_y: float, wait: bool = True):
        """
        Records walking to a target.
        If wait=True, yields a timeout corresponding to the travel time.
        """
        dist = math.hypot(target_x - self.x, target_y - self.y)
        duration = dist / self.speed

        start_time = self.env.now
        end_time = start_time + duration

        self.env.record_motion(
            self,
            start_time=start_time,
            end_time=end_time,
            start_x=self.x,
            start_y=self.y,
            end_x=target_x,
            end_y=target_y,
        )

        # Update internal state
        self.x = target_x
        self.y = target_y

        if wait:
            return self.env.timeout(duration)
        return None

    def wait(self, duration: float):
        """Records a stationary wait."""
        self.env.record_stay(
            self,
            start_time=self.env.now,
            end_time=self.env.now + duration,
            x=self.x,
            y=self.y,
        )
        return self.env.timeout(duration)

    def run(self, counter: simpy.Resource, time_in_bank: float):
        """
        Customer's main behavior loop - arrives, waits in queue, gets served or reneges.
        This makes the customer feel more agent-like with its logic encapsulated.
        """
        # Start at source position
        self.set_position(*Config.source_pos)

        # Walk to queue
        yield self.walk_to(*Config.queue_pos)

        arrive = self.env.now
        print(f"{arrive:7.4f} {self.name}: Here I am")

        with counter.request() as req:
            patience = random.uniform(MIN_PATIENCE, MAX_PATIENCE)

            results = yield req | self.env.timeout(patience)
            wait = self.env.now - arrive

            if wait > 0:
                # Record that we stood in the queue
                self.env.record_stay(
                    self, start_time=arrive, end_time=self.env.now, x=self.x, y=self.y
                )

            if req in results:
                print(f"{self.env.now:7.4f} {self.name}: Waited {wait:6.3f}")

                # Move to counter
                yield self.walk_to(*Config.counter_pos)

                # Service time
                tib = random.expovariate(1.0 / time_in_bank)
                yield self.wait(tib)

                print(f"{self.env.now:7.4f} {self.name}: Finished")

                # Walk to exit (Fire and forget simulation-wise, but recorded)
                self.walk_to(*Config.exit_pos, wait=False)

            else:
                print(f"{self.env.now:7.4f} {self.name}: RENEGED after {wait:6.3f}")

                # Walk to exit (Fire and forget)
                self.walk_to(*Config.exit_pos, wait=False)


# --- Simulation Processes ---


def source(env, number, interval, counter):
    """Source generates customers randomly"""
    for i in range(number):
        cust = BankCustomer(env, f"Customer{i:02d}", speed=Config.walk_speed)
        env.process(cust.run(counter, time_in_bank=12.0))
        t = random.expovariate(1.0 / interval)
        yield env.timeout(t)


def main():
    print("Bank renege")
    random.seed(RANDOM_SEED)
    env = RecordingEnvironment()

    # Setup Counter (encapsulated in BankCounter)
    bank_counter = BankCounter(
        env, capacity=1, x=Config.counter_pos[0], y=Config.counter_pos[1]
    )

    # Run simulation
    env.process(source(env, NEW_CUSTOMERS, INTERVAL_CUSTOMERS, bank_counter.resource))
    env.run()
    env.save_recording("simulation-records/bank_renege_recording.json")


if __name__ == "__main__":
    main()

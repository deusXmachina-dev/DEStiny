"""
Bank renege example with dxm visualization (Refactored)

Covers:
- Resources: Resource
- Condition events
- dxm visualization (Encapsulated)

Scenario:
  A counter with a random service time and customers who renege. Based on the
  program bank08.py from TheBank tutorial of SimPy 2. (KGM)
"""
import json
import math
import os
import random
from dataclasses import dataclass

import simpy

from dxm.core.environment import RecordingEnvironment
from dxm.core.rendering import RenderingInfo, SimulationEntityType
from dxm.core.simulation_entity import SimulationEntity

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
            end_y=target_y
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
            y=self.y
        )
        return self.env.timeout(duration)


# --- Simulation Processes ---

def source(env, number, interval, counter):
    """Source generates customers randomly"""
    for i in range(number):
        c = customer(env, f'Customer{i:02d}', counter, time_in_bank=12.0)
        env.process(c)
        t = random.expovariate(1.0 / interval)
        yield env.timeout(t)


def customer(env, name, counter, time_in_bank):
    """Customer arrives, is served and leaves."""
    cust = BankCustomer(env, name, speed=Config.walk_speed)
    cust.set_position(*Config.source_pos)

    # Walk to queue
    yield cust.walk_to(*Config.queue_pos)

    arrive = env.now
    print(f'{arrive:7.4f} {name}: Here I am')

    with counter.request() as req:
        patience = random.uniform(MIN_PATIENCE, MAX_PATIENCE)
        
        # Wait for counter or patience
        # Note: We only visualize the "waiting" stay if we actually waited
        # longer than 0. But logically we just yield on the request/patience.
        # For visualization, we might want to record the stay AFTER we know
        # how long it was, or we record a stay with indefinite end?
        # dxm's record_stay works best with definite times or updates.
        # Here we follow the original pattern: calculate wait after the fact.
        
        results = yield req | env.timeout(patience)
        wait = env.now - arrive

        if wait > 0:
            # Record that we stood in the queue
            env.record_stay(
                cust, start_time=arrive, end_time=env.now, x=cust.x, y=cust.y
            )

        if req in results:
            print(f'{env.now:7.4f} {name}: Waited {wait:6.3f}')
            
            # Move to counter
            yield cust.walk_to(*Config.counter_pos)

            # Service time
            tib = random.expovariate(1.0 / time_in_bank)
            yield cust.wait(tib)
            
            print(f'{env.now:7.4f} {name}: Finished')
            
            # Walk to exit (Fire and forget simulation-wise, but recorded)
            cust.walk_to(*Config.exit_pos, wait=False)

        else:
            print(f'{env.now:7.4f} {name}: RENEGED after {wait:6.3f}')
            
            # Walk to exit (Fire and forget)
            cust.walk_to(*Config.exit_pos, wait=False)


def main():
    print('Bank renege')
    random.seed(RANDOM_SEED)
    env = RecordingEnvironment()

    # Setup Counter
    counter = simpy.Resource(env, capacity=1)
    bank_counter = BankCounter()
    env.record_stay(
        bank_counter,
        start_time=0,
        x=Config.counter_pos[0],
        y=Config.counter_pos[1],
    )
    
    # Start Source
    env.process(source(env, NEW_CUSTOMERS, INTERVAL_CUSTOMERS, counter))
    
    env.run()
    
    # Export
    recording = env.get_recording()
    print(f"Recorded {len(recording.segments_by_entity)} entities")

    os.makedirs("simulation-records", exist_ok=True)
    output_file = "simulation-records/bank_renege_recording.json"
    
    with open(output_file, "w") as f:
        json.dump(recording.to_dict(), f, indent=2)
    print(f"Recording exported to {output_file}")


if __name__ == "__main__":
    main()

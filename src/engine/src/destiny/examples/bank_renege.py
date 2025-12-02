"""
Bank renege example with Destiny visualization

Covers:

- Resources: Resource

- Condition events

- Destiny visualization

Scenario:

  A counter with a random service time and customers who renege. Based on the

  program bank08.py from TheBank tutorial of SimPy 2. (KGM)

"""
import math
import random
import simpy
import json
import os

from destiny.core.environment import RecordingEnvironment
from destiny.core.simulation_entity import SimulationEntity
from destiny.core.rendering import RenderingInfo, SimulationEntityType

RANDOM_SEED = 42
NEW_CUSTOMERS = 25  # Total number of customers
INTERVAL_CUSTOMERS = 10.0  # Generate new customers roughly every x seconds
MIN_PATIENCE = 1  # Min. customer patience
MAX_PATIENCE = 3  # Max. customer patience

# Visualization constants
COUNTER_X, COUNTER_Y = 500, 100
SOURCE_X, SOURCE_Y = 100, 500
EXIT_X, EXIT_Y = 900, 500
QUEUE_X, QUEUE_Y = 500, 200
WALK_SPEED = 100.0  # units per second


class BankCounter(SimulationEntity):
    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.COUNTER)


class BankCustomer(SimulationEntity):
    def __init__(self, name):
        super().__init__()
        self.name = name

    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.HUMAN)


def source(env, number, interval, counter):
    """Source generates customers randomly"""
    for i in range(number):
        c = customer(env, f'Customer{i:02d}', counter, time_in_bank=12.0)
        env.process(c)
        t = random.expovariate(1.0 / interval)
        yield env.timeout(t)


def customer(env, name, counter, time_in_bank):
    """Customer arrives, is served and leaves."""
    cust_entity = BankCustomer(name)

    # Walk to queue
    dist_to_queue = math.hypot(QUEUE_X - SOURCE_X, QUEUE_Y - SOURCE_Y)
    walk_time = dist_to_queue / WALK_SPEED

    env.record_motion(
        cust_entity,
        start_time=env.now,
        end_time=env.now + walk_time,
        start_x=SOURCE_X,
        start_y=SOURCE_Y,
        end_x=QUEUE_X,
        end_y=QUEUE_Y
    )
    yield env.timeout(walk_time)

    arrive = env.now
    print(f'{arrive:7.4f} {name}: Here I am')

    with counter.request() as req:
        patience = random.uniform(MIN_PATIENCE, MAX_PATIENCE)
        # Wait for the counter or abort at the end of our tether
        results = yield req | env.timeout(patience)

        wait = env.now - arrive
        
        # Record waiting time in queue if they waited
        if wait > 0:
            env.record_stay(
                cust_entity,
                start_time=arrive,
                end_time=env.now,
                x=QUEUE_X,
                y=QUEUE_Y
            )

        if req in results:
            # We got to the counter
            print(f'{env.now:7.4f} {name}: Waited {wait:6.3f}')
            
            # Move to counter (short walk)
            step_time = 0.5
            env.record_motion(
                cust_entity,
                start_time=env.now,
                end_time=env.now + step_time,
                start_x=QUEUE_X,
                start_y=QUEUE_Y,
                end_x=COUNTER_X,
                end_y=COUNTER_Y
            )
            yield env.timeout(step_time)

            tib = random.expovariate(1.0 / time_in_bank)
            
            # Record service time
            env.record_stay(
                cust_entity,
                start_time=env.now,
                end_time=env.now + tib,
                x=COUNTER_X,
                y=COUNTER_Y
            )
            
            yield env.timeout(tib)
            print(f'{env.now:7.4f} {name}: Finished')
            
            # Walk to exit
            start_exit_walk = env.now
            dist_to_exit = math.hypot(EXIT_X - COUNTER_X, EXIT_Y - COUNTER_Y)
            exit_walk_time = dist_to_exit / WALK_SPEED
            
            env.record_motion(
                cust_entity,
                start_time=start_exit_walk,
                end_time=start_exit_walk + exit_walk_time,
                start_x=COUNTER_X,
                start_y=COUNTER_Y,
                end_x=EXIT_X,
                end_y=EXIT_Y
            )

        else:
            # We reneged
            print(f'{env.now:7.4f} {name}: RENEGED after {wait:6.3f}')
            
            # Walk to exit from queue
            start_exit_walk = env.now
            dist_to_exit = math.hypot(EXIT_X - QUEUE_X, EXIT_Y - QUEUE_Y)
            exit_walk_time = dist_to_exit / WALK_SPEED
            
            env.record_motion(
                cust_entity,
                start_time=start_exit_walk,
                end_time=start_exit_walk + exit_walk_time,
                start_x=QUEUE_X,
                start_y=QUEUE_Y,
                end_x=EXIT_X,
                end_y=EXIT_Y
            )


def main():
    # Setup and start the simulation
    print('Bank renege')
    random.seed(RANDOM_SEED)
    env = RecordingEnvironment()

    # Start processes and run
    counter = simpy.Resource(env, capacity=1)
    
    # Create visual entity for the counter
    bank_counter_entity = BankCounter()
    # Record it staying at its position indefinitely (or until simulation ends)
    env.record_stay(bank_counter_entity, start_time=0, x=COUNTER_X, y=COUNTER_Y)
    
    env.process(source(env, NEW_CUSTOMERS, INTERVAL_CUSTOMERS, counter))
    
    # Run simulation
    env.run()
    
    # Export recording
    recording = env.get_recording()
    print(f"Recorded {len(recording.segments_by_entity)} entities")

    os.makedirs("simulation-records", exist_ok=True)
    output_file = "simulation-records/bank_renege_recording.json"
    
    with open(output_file, "w") as f:
        json.dump(recording.to_dict(), f, indent=2)
    print(f"Recording exported to {output_file}")


if __name__ == "__main__":
    main()


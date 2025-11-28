"""
Bank renege example adapted for destiny framework.

Covers:
- Resources: Resource
- Condition events
- Visualization via SimulationContainer

Scenario:
  A counter with a random service time and customers who renege.
"""

import random
import json
from dataclasses import asdict, dataclass

import simpy

from destiny.core.environment import TickingEnvironment
from destiny.core.simulation_container import SimulationContainer
from destiny.core.snapshot import ComponentSnapshot

RANDOM_SEED = 45
NEW_CUSTOMERS = 5  # Total number of customers
INTERVAL_CUSTOMERS = 10.0  # Generate new customers roughly every x seconds
MIN_PATIENCE = 1  # Min. customer patience
MAX_PATIENCE = 3  # Max. customer patience


@dataclass(frozen=True)
class BankSnapshot(ComponentSnapshot):
    state: str = "idle"


class BankCounter(SimulationContainer):
    """
    A bank counter resource that can be visualized.
    """
    def __init__(self, env, capacity=1, x=0, y=0):
        super().__init__()
        self.resource = simpy.Resource(env, capacity=capacity)
        self.x = x
        self.y = y
        self.env = env
        env.add_child(self)

    def _get_snapshot_state(self, t: float) -> ComponentSnapshot | None:
        # Determine state based on resource usage
        state = "busy" if self.resource.count > 0 else "idle"
        return BankSnapshot(
            type="BankCounter",
            x=self.x,
            y=self.y,
            angle=0,
            state=state,
            id=self.id
        )


@dataclass(frozen=True)
class CustomerSnapshot(ComponentSnapshot):
    state: str = "new"  # new, waiting, served, reneged, finished


class Customer(SimulationContainer):
    """
    Customer arrives, is served and leaves.
    """
    def __init__(self, env, name, counter, time_in_bank):
        super().__init__()
        self.env = env
        self.name = name
        self.counter = counter
        self.time_in_bank = time_in_bank
        
        # Visualization state
        self.x = 0
        self.y = 0
        self.state = "new"
        
        env.add_child(self)
        self.process = env.process(self.run())

    def run(self):
        arrive = self.env.now
        print(f'{arrive:7.4f} {self.name}: Here I am')
        
        # Move to waiting area
        self.x = 100
        self.y = 100 + random.uniform(-20, 20)
        self.state = "waiting"

        with self.counter.resource.request() as req:
            patience = random.uniform(MIN_PATIENCE, MAX_PATIENCE)
            # Wait for the counter or abort at the end of our tether
            results = yield req | self.env.timeout(patience)

            wait = self.env.now - arrive

            if req in results:
                # We got to the counter
                print(f'{self.env.now:7.4f} {self.name}: Waited {wait:6.3f}')
                
                # Move to counter
                self.x = self.counter.x
                self.y = self.counter.y + 50 # slightly offset
                self.state = "served"

                tib = random.expovariate(1.0 / self.time_in_bank)
                yield self.env.timeout(tib)
                print(f'{self.env.now:7.4f} {self.name}: Finished')
                self.state = "finished"
                self.x = 300
                self.y = 100

            else:
                # We reneged
                print(f'{self.env.now:7.4f} {self.name}: RENEGED after {wait:6.3f}')
                self.state = "reneged"
                self.x = 100
                self.y = 300

    def _get_snapshot_state(self, t: float) -> ComponentSnapshot | None:
        return CustomerSnapshot(
            type="Customer",
            x=self.x,
            y=self.y,
            angle=0,
            state=self.state,
            id=self.id
        )


def source(env, number, interval, counter):
    """Source generates customers randomly"""
    for i in range(number):
        c = Customer(env, f'Customer{i:02d}', counter, time_in_bank=12.0)
        t = random.expovariate(1.0 / interval)
        yield env.timeout(t)


def main():
    # Setup and start the simulation
    print('Bank renege')
    random.seed(RANDOM_SEED)
    
    # Use TickingEnvironment for snapshots
    # factor=0 means run as fast as possible, not real-time
    env = TickingEnvironment(tick_interval=1.0, factor=0)

    # Start processes and run
    counter = BankCounter(env, capacity=1, x=200, y=100)
    env.process(source(env, NEW_CUSTOMERS, INTERVAL_CUSTOMERS, counter))
    
    # Run simulation and collect snapshots
    all_snapshots = []
    # Run long enough for all customers to finish/renege. 
    # 5 customers * ~10s interval + service times... say 100s
    for step_snapshot in env.iterate(until=100):
        all_snapshots.append(step_snapshot)

    # Export snapshots
    with open("bank_renege_snapshots.json", "w") as f:
        json.dump([asdict(s) for s in all_snapshots], f, indent=2)
    print("Snapshots exported to bank_renege_snapshots.json")

    export_compact_snapshots(all_snapshots, "bank_renege_snapshots.msgpack")


def export_compact_snapshots(snapshots, filename):
    """
    Export snapshots in a compact MessagePack format.
    Format: [strings_list, [frame_1, frame_2, ...]]
    Frame: [time, [component_1, component_2, ...]]
    Component: [type_idx, x, y, angle, state_idx, id_idx]
    """
    import msgpack

    string_map = {}
    strings_list = []

    def get_string_idx(s):
        if s not in string_map:
            string_map[s] = len(strings_list)
            strings_list.append(s)
        return string_map[s]

    frames = []
    for snap in snapshots:
        components_data = []
        for comp in snap.components:
            # Flatten component data
            # [type_idx, x, y, angle, state_idx, id_idx]
            comp_data = [
                get_string_idx(comp.type),
                comp.x,
                comp.y,
                comp.angle,
                get_string_idx(getattr(comp, 'state', '')),
                get_string_idx(comp.id)
            ]
            components_data.append(comp_data)
        
        frames.append([snap.time, components_data])

    data = [strings_list, frames]
    
    with open(filename, "wb") as f:
        msgpack.pack(data, f)
    
    print(f"Compact snapshots exported to {filename}")



if __name__ == "__main__":
    main()

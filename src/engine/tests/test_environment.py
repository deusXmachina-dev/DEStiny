import pytest

import time
from simpy import Environment
from destiny.core.environment import TickingEnvironment


def process(env: Environment):
    while True:
        yield env.timeout(0.1)


def test_environment_ticks_correctly():
    env = TickingEnvironment(tick_interval=0.1, initial_time=0.0, factor=0.05)

    time_start = time.time()
    ticks = []
    for i in range(10):
        ticks.append(env.advance())

    assert len(ticks) == 10
    assert pytest.approx(time.time() - time_start, 0.1) == 0.05

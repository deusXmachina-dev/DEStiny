import pytest

from destiny.agv.store_location import StoreLocation
from destiny.core.environment import TickingEnvironment

@pytest.fixture
def env():
    return TickingEnvironment(tick_interval=1.0)

def test_store_location_initialization(env):
    loc = StoreLocation(env, x=10.0, y=20.0)
    assert loc.x == 10.0
    assert loc.y == 20.0
    assert loc.store.capacity == float('inf')
    assert len(loc.store.items) == 0

def test_store_location_initial_items(env):
    initial_items = ["item1", "item2"]
    loc = StoreLocation(env, x=0, y=0, initial_items=initial_items)
    assert len(loc.store.items) == 2
    assert "item1" in loc.store.items
    assert "item2" in loc.store.items

def test_store_location_put_get_item(env):
    loc = StoreLocation(env, x=0, y=0)
    
    def producer(env, loc):
        yield loc.put_item("item1")
        yield loc.put_item("item2")
    
    def consumer(env, loc):
        item1 = yield loc.get_item()
        assert item1 == "item1"
        item2 = yield loc.get_item()
        assert item2 == "item2"

    env.process(producer(env, loc))
    env.process(consumer(env, loc))
    env.run()

def test_store_location_capacity(env):
    loc = StoreLocation(env, x=0, y=0, capacity=1)

    time_of_removal = 0.000001
    
    def producer(env, loc):
        yield loc.put_item("item1")
        yield loc.put_item("item2")
        assert env.now >= time_of_removal

    def consumer(env, loc):
        yield env.timeout(time_of_removal)
        item = yield loc.get_item()
        assert item == "item1"

    env.process(producer(env, loc))
    env.process(consumer(env, loc))
    env.run()


def test_inheritance_is_correct(env):
    loc = StoreLocation(env, x=1, y=2)
    # Check Location methods
    other = StoreLocation(env, x=4, y=6)
    assert loc.distance_to(other) == 5.0

"""Tests for Environment and motion recording."""
from destiny.core.environment import Environment
from destiny.core.simulation_container import SimulationEntity


class DummyEntity(SimulationEntity):
    def _get_entity_type(self) -> str:
        return "dummy"


def test_environment_initializes():
    env = Environment(initial_time=5.0, factor=0)
    assert env.now == 5.0


def test_environment_runs():
    env = Environment(factor=0)
    
    events = []
    def process(env):
        while True:
            events.append(env.now)
            yield env.timeout(1.0)
    
    env.process(process(env))
    env.run(until=5.0)
    
    assert env.now == 5.0
    assert len(events) == 5


def test_record_motion():
    env = Environment(factor=0)
    entity = DummyEntity()
    
    env.record_motion(
        entity=entity,
        start_time=0,
        end_time=5,
        start_x=0,
        start_y=0,
        end_x=100,
        end_y=0,
    )
    
    recording = env.get_recording()
    assert len(recording.segments_by_entity[entity.id]) == 1
    
    seg = recording.segments_by_entity[entity.id][0]
    assert seg.entity_id == entity.id
    assert seg.entity_type == "dummy"
    assert seg.parent_id is None
    assert seg.start_x == 0
    assert seg.end_x == 100


def test_record_motion_with_parent():
    env = Environment(factor=0)
    parent = DummyEntity()
    child = DummyEntity()
    
    env.record_motion(
        entity=child,
        parent=parent,
        start_time=0,
        end_time=5,
        start_x=0,
        start_y=0,
        end_x=0,
        end_y=0,
    )
    
    recording = env.get_recording()
    seg = recording.segments_by_entity[child.id][0]
    assert seg.parent_id == parent.id


def test_recording_to_dict():
    env = Environment(factor=0)
    entity = DummyEntity()
    
    env.record_motion(
        entity=entity,
        start_time=0,
        end_time=10,
        start_x=0,
        start_y=0,
        end_x=100,
        end_y=50,
        start_angle=0,
        end_angle=1.5,
    )
    
    env.run(until=10)
    recording = env.get_recording()
    data = recording.to_dict()
    
    assert data["duration"] == 10
    assert len(data["segments_by_entity"][entity.id]) == 1
    
    seg = data["segments_by_entity"][entity.id][0]
    assert seg["entityId"] == entity.id
    assert seg["entityType"] == "dummy"
    assert seg["startX"] == 0
    assert seg["endX"] == 100
    assert seg["startAngle"] == 0
    assert seg["endAngle"] == 1.5

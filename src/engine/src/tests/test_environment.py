"""Tests for RecordingEnvironment and motion recording."""

from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity


class DummyEntity(SimulationEntity):
    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.EMPTY)


def test_environment_initializes():
    env = RecordingEnvironment(initial_time=5.0)
    assert env.now == 5.0


def test_environment_runs():
    env = RecordingEnvironment()

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
    env = RecordingEnvironment()
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
    assert len(recording.motion_segments_by_entity[entity.id]) == 1

    seg = recording.motion_segments_by_entity[entity.id][0]
    assert seg.entity_id == entity.id
    assert seg.entity_type == SimulationEntityType.EMPTY
    assert seg.parent_id is None
    assert seg.start_x == 0
    assert seg.end_x == 100


def test_record_motion_with_parent():
    env = RecordingEnvironment()
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
    seg = recording.motion_segments_by_entity[child.id][0]
    assert seg.parent_id == parent.id


def test_recording_to_dict():
    env = RecordingEnvironment()
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
    data = recording.model_dump(by_alias=True)

    assert data["duration"] == 10
    assert len(data["motion_segments_by_entity"][entity.id]) == 1

    seg = data["motion_segments_by_entity"][entity.id][0]
    assert seg["entityId"] == entity.id
    assert seg["entityType"] == SimulationEntityType.EMPTY
    assert seg["startX"] == 0
    assert seg["endX"] == 100
    assert seg["startAngle"] == 0
    assert seg["endAngle"] == 1.5


def test_record_stay():
    env = RecordingEnvironment()
    parent = DummyEntity()
    child = DummyEntity()

    env.record_stay(
        entity=child,
        parent=parent,
        start_time=1.0,
        end_time=5.0,
        x=10.0,
        y=20.0,
    )

    recording = env.get_recording()
    seg = recording.motion_segments_by_entity[child.id][0]
    assert seg.parent_id == parent.id
    assert seg.start_x == seg.end_x == 10.0
    assert seg.start_y == seg.end_y == 20.0


def test_record_disappearance():
    """Test disappearance recording at current time."""
    env = RecordingEnvironment()
    entity = DummyEntity()

    env.record_disappearance(entity=entity)

    recording = env.get_recording()
    assert len(recording.motion_segments_by_entity[entity.id]) == 1

    seg = recording.motion_segments_by_entity[entity.id][0]
    assert seg.entity_id == entity.id
    assert seg.start_time == env.now
    assert seg.end_time == env.now
    assert seg.start_time == seg.end_time


def test_record_motion_timeout_in_process():
    """Test that record_motion returns a timeout that can be yielded in a process."""
    env = RecordingEnvironment()
    entity = DummyEntity()
    completion_times = []

    def process():
        # Record motion with duration - much simpler!
        yield env.record_motion(
            entity=entity,
            duration=5.0,
            start_x=0,
            start_y=0,
            end_x=100,
            end_y=0,
        )
        completion_times.append(env.now)

    env.process(process())
    env.run(until=10.0)

    # Should complete at time 5.0
    assert len(completion_times) == 1
    assert completion_times[0] == 5.0


def test_record_motion_with_speed():
    """Test that record_motion can calculate duration from speed."""
    env = RecordingEnvironment()
    entity = DummyEntity()
    completion_times = []

    def process():
        # Record motion with speed - calculates duration from distance automatically!
        yield env.record_motion(
            entity=entity,
            speed=20.0,  # 20 units per time unit
            start_x=0,
            start_y=0,
            end_x=100,  # distance = 100, so duration = 100/20 = 5.0
            end_y=0,
        )
        completion_times.append(env.now)

    env.process(process())
    env.run(until=10.0)

    # Should complete at time 5.0 (100 distance / 20 speed = 5 duration)
    assert len(completion_times) == 1
    assert completion_times[0] == 5.0


def test_record_stay_infinite_timeout_zero():
    """Test that infinite stay returns timeout(0) which fires immediately."""
    env = RecordingEnvironment()
    entity = DummyEntity()
    completion_times = []

    def process():
        # Record infinite stay (no duration/end_time) - returns timeout(0)
        yield env.record_stay(
            entity=entity,
            x=10,
            y=20,
        )
        completion_times.append(env.now)

    env.process(process())
    env.run(until=10.0)

    # timeout(0) fires immediately, so should complete at time 0
    assert len(completion_times) == 1
    assert completion_times[0] == 0.0


def test_record_stay_with_duration():
    """Test that record_stay with duration returns appropriate timeout."""
    env = RecordingEnvironment()
    entity = DummyEntity()
    completion_times = []

    def process():
        # Record stay with duration - much simpler!
        yield env.record_stay(
            entity=entity,
            duration=3.0,
            x=10,
            y=20,
        )
        completion_times.append(env.now)

    env.process(process())
    env.run(until=10.0)

    # Should complete at time 3.0
    assert len(completion_times) == 1
    assert completion_times[0] == 3.0

"""Tests for ProgressSegment recording."""

from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity


class DummyEntity(SimulationEntity):
    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.EMPTY)


def test_record_progress():
    """Test basic progress recording."""
    env = RecordingEnvironment()
    entity = DummyEntity()

    env.record_progress(
        entity=entity,
        start_time=0.0,
        end_time=10.0,
        start_value=0.0,
        end_value=100.0,
        min_value=0.0,
        max_value=100.0,
    )

    recording = env.get_recording()
    assert len(recording.progress_segments_by_entity[entity.id]) == 1

    seg = recording.progress_segments_by_entity[entity.id][0]
    assert seg.entity_id == entity.id
    assert seg.start_time == 0.0
    assert seg.end_time == 10.0
    assert seg.start_value == 0.0
    assert seg.end_value == 100.0
    assert seg.min_value == 0.0
    assert seg.max_value == 100.0


def test_record_progress_with_duration():
    """Test progress recording with duration instead of end_time."""
    env = RecordingEnvironment()
    entity = DummyEntity()

    env.record_progress(
        entity=entity,
        start_time=5.0,
        duration=15.0,
        start_value=10.0,
        end_value=50.0,
        min_value=0.0,
        max_value=100.0,
    )

    recording = env.get_recording()
    seg = recording.progress_segments_by_entity[entity.id][0]
    assert seg.start_time == 5.0
    assert seg.end_time == 20.0  # 5.0 + 15.0
    assert seg.start_value == 10.0
    assert seg.end_value == 50.0


def test_record_progress_defaults_to_current_time():
    """Test that start_time defaults to env.now."""
    env = RecordingEnvironment()
    entity = DummyEntity()

    env.run(until=7.5)
    env.record_progress(
        entity=entity,
        start_value=0.0,
        end_value=50.0,
        min_value=0.0,
        max_value=100.0,
    )

    recording = env.get_recording()
    seg = recording.progress_segments_by_entity[entity.id][0]
    assert seg.start_time == 7.5


def test_record_progress_value():
    """Test recording constant progress value."""
    env = RecordingEnvironment()
    entity = DummyEntity()

    env.record_progress_value(
        entity=entity,
        start_time=0.0,
        end_time=5.0,
        value=75.0,
        min_value=0.0,
        max_value=100.0,
    )

    recording = env.get_recording()
    seg = recording.progress_segments_by_entity[entity.id][0]
    assert seg.start_value == 75.0
    assert seg.end_value == 75.0
    assert seg.start_time == 0.0
    assert seg.end_time == 5.0


def test_record_progress_infinite():
    """Test recording progress with no end_time (infinite)."""
    env = RecordingEnvironment()
    entity = DummyEntity()

    env.record_progress(
        entity=entity,
        start_time=0.0,
        end_time=None,
        start_value=0.0,
        end_value=100.0,
        min_value=0.0,
        max_value=100.0,
    )

    recording = env.get_recording()
    seg = recording.progress_segments_by_entity[entity.id][0]
    assert seg.end_time is None


def test_multiple_progress_segments():
    """Test multiple progress segments for the same entity."""
    env = RecordingEnvironment()
    entity = DummyEntity()

    env.record_progress(
        entity=entity,
        start_time=0.0,
        end_time=5.0,
        start_value=0.0,
        end_value=50.0,
        min_value=0.0,
        max_value=100.0,
    )

    env.record_progress(
        entity=entity,
        start_time=5.0,
        end_time=10.0,
        start_value=50.0,
        end_value=100.0,
        min_value=0.0,
        max_value=100.0,
    )

    recording = env.get_recording()
    segments = recording.progress_segments_by_entity[entity.id]
    assert len(segments) == 2
    assert segments[0].end_value == 50.0
    assert segments[1].start_value == 50.0
    assert segments[1].end_value == 100.0


def test_progress_recording_in_get_recording():
    """Test that progress segments are included in get_recording()."""
    env = RecordingEnvironment()
    entity = DummyEntity()

    env.record_progress(
        entity=entity,
        start_value=0.0,
        end_value=100.0,
        min_value=0.0,
        max_value=100.0,
    )

    recording = env.get_recording()
    assert entity.id in recording.progress_segments_by_entity
    assert len(recording.progress_segments_by_entity[entity.id]) == 1


def test_progress_recording_to_dict():
    """Test that progress segments serialize correctly."""
    env = RecordingEnvironment()
    entity = DummyEntity()

    env.record_progress(
        entity=entity,
        start_time=0.0,
        end_time=10.0,
        start_value=25.0,
        end_value=75.0,
        min_value=0.0,
        max_value=100.0,
    )

    recording = env.get_recording()
    data = recording.model_dump(by_alias=True)

    assert "progress_segments_by_entity" in data
    seg = data["progress_segments_by_entity"][entity.id][0]
    assert seg["entity_id"] == entity.id
    assert seg["start_time"] == 0.0
    assert seg["end_time"] == 10.0
    assert seg["start_value"] == 25.0
    assert seg["end_value"] == 75.0
    assert seg["min_value"] == 0.0
    assert seg["max_value"] == 100.0

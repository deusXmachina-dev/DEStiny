"""Tests for SimulationEntity."""
from destiny.core.simulation_entity import SimulationEntity


class DummyEntity(SimulationEntity):
    def _get_entity_type(self) -> str:
        return "dummy"


def test_entity_has_unique_id():
    e1 = DummyEntity()
    e2 = DummyEntity()
    assert e1.id != e2.id
    assert len(e1.id) > 0


def test_entity_has_type():
    entity = DummyEntity()
    assert entity._get_entity_type() == "dummy"

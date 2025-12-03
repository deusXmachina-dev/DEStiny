"""Tests for SimulationEntity."""

from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity


class DummyEntity(SimulationEntity):
    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.EMPTY)


def test_entity_has_unique_id():
    e1 = DummyEntity()
    e2 = DummyEntity()
    assert e1.id != e2.id
    assert len(e1.id) > 0


def test_entity_has_rendering_info():
    entity = DummyEntity()
    rendering_info = entity.get_rendering_info()
    assert rendering_info.entity_type == SimulationEntityType.EMPTY

from destiny.core.simulation_container import SimulationContainer
from destiny.core.environment import TickingEnvironment
from destiny.core.snapshot import ComponentSnapshot


class ContainerForTest(SimulationContainer):
    def __init__(self, type: str, x: float, y: float, angle: float):
        super().__init__()
        self.type = type
        self.x = x
        self.y = y
        self.angle = angle

    def _get_snapshot_state(self, t: float) -> ComponentSnapshot | None:
        return ComponentSnapshot(type=self.type, x=self.x, y=self.y, angle=self.angle)


class ContainerForTestThatReturnsNone(SimulationContainer):
    def __init__(self):
        super().__init__()

    def _get_snapshot_state(self, t: float) -> ComponentSnapshot | None:
        return None


def test_container_snapshots_correctly():
    env = TickingEnvironment(tick_interval=0.1, initial_time=0.0, factor=0)

    container = ContainerForTest(type="test", x=0.0, y=0.0, angle=0.0)
    env.add_child(container)

    snapshot = env.advance()

    assert len(snapshot.components) == 1
    assert snapshot.components[0].type == "test"
    assert snapshot.components[0].x == 0.0
    assert snapshot.components[0].y == 0.0
    assert snapshot.components[0].angle == 0.0
    assert snapshot.components[0].children == []
    assert snapshot.components[0].id == container.id
    assert len(snapshot.components[0].id) > 0


def test_env_snapshots_multiple_containers():
    env = TickingEnvironment(tick_interval=0.1, initial_time=0.0, factor=0)

    container1 = ContainerForTest(type="test", x=0.0, y=0.0, angle=0.0)
    env.add_child(container1)
    container2 = ContainerForTest(type="test2", x=1.0, y=1.0, angle=0.0)
    env.add_child(container2)

    snapshot = env.advance()

    assert len(snapshot.components) == 2
    assert snapshot.components[0].type == "test"
    assert snapshot.components[0].x == 0.0
    assert snapshot.components[0].y == 0.0
    assert snapshot.components[0].angle == 0.0
    assert snapshot.components[0].children == []
    assert snapshot.components[1].type == "test2"
    assert snapshot.components[1].x == 1.0
    assert snapshot.components[1].y == 1.0
    assert snapshot.components[1].angle == 0.0
    assert snapshot.components[1].children == []


def test_env_does_not_snapshot_containers_that_return_none():
    env = TickingEnvironment(tick_interval=0.1, initial_time=0.0, factor=0)

    container1 = ContainerForTest(type="test", x=0.0, y=0.0, angle=0.0)
    env.add_child(container1)
    container2 = ContainerForTestThatReturnsNone()
    env.add_child(container2)
    snapshot = env.advance()

    assert len(snapshot.components) == 1


def test_hierarchical_snapshotting():
    env = TickingEnvironment(tick_interval=0.1, initial_time=0.0, factor=0)

    parent = ContainerForTest(type="parent", x=0.0, y=0.0, angle=0.0)
    child = ContainerForTest(type="child", x=1.0, y=1.0, angle=0.0)
    grandchild = ContainerForTest(type="grandchild", x=2.0, y=2.0, angle=0.0)

    parent.add_child(child)
    child.add_child(grandchild)
    env.add_child(parent)

    snapshot = env.advance()

    assert len(snapshot.components) == 1
    parent_snapshot = snapshot.components[0]
    assert parent_snapshot.type == "parent"
    assert len(parent_snapshot.children) == 1

    child_snapshot = parent_snapshot.children[0]
    assert child_snapshot.type == "child"
    assert len(child_snapshot.children) == 1

    grandchild_snapshot = child_snapshot.children[0]
    assert grandchild_snapshot.type == "grandchild"
    assert len(grandchild_snapshot.children) == 0

    assert parent_snapshot.id == parent.id
    assert child_snapshot.id == child.id
    assert grandchild_snapshot.id == grandchild.id
    assert parent.id != child.id
    assert child.id != grandchild.id

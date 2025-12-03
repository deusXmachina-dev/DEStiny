import math

from destiny_sim.agv.location import Location


def test_initialization_and_equality():
    loc1 = Location(1.0, 2.0)
    loc2 = Location(1.0, 2.0)
    loc3 = Location(3.0, 4.0)

    assert loc1.x == 1.0
    assert loc1.y == 2.0
    assert loc1 == loc2
    assert loc1 != loc3
    assert repr(loc1) == "Location(x=1.0, y=2.0)"


def test_distance_to():
    p1 = Location(0, 0)
    p2 = Location(3, 4)

    assert p1.distance_to(p2) == 5.0
    assert p2.distance_to(p1) == 5.0
    assert p1.distance_to(p1) == 0.0


def test_move_towards_partial():
    start = Location(0, 0)
    target = Location(10, 0)

    # Move 2 units towards (10, 0) -> should be (2, 0)
    new_loc = start.move_towards(target, 2.0)
    assert new_loc == Location(2.0, 0.0)

    # Move 50% of diagonal
    start = Location(0, 0)
    target = Location(2, 2)  # dist is sqrt(8) approx 2.828
    dist = start.distance_to(target)
    new_loc = start.move_towards(target, dist / 2)

    assert math.isclose(new_loc.x, 1.0)
    assert math.isclose(new_loc.y, 1.0)


def test_move_towards_overshoot():
    # Current implementation allows overshooting based on the math
    start = Location(0, 0)
    target = Location(10, 0)

    # Move 15 units towards (10, 0) -> should be (15, 0)
    new_loc = start.move_towards(target, 15.0, clip=False)
    assert new_loc == Location(15.0, 0.0)

    new_loc = start.move_towards(target, 15.0, clip=True)
    assert new_loc == Location(10.0, 0.0)


def test_move_towards_zero_distance():
    start = Location(1, 1)
    target = Location(5, 5)

    # Returns a new location at the same spot
    assert start.move_towards(target, 0) == start


def test_move_towards_self():
    # Edge case: moving towards self (distance 0 between points)
    start = Location(1, 1)

    # Should return self (identity)
    assert start.move_towards(start, 5.0) is start


def test_angle_to():
    # 1. Same location
    p1 = Location(1, 1)
    assert p1.angle_to(p1) is None

    # 2. Along positive X
    p1 = Location(0, 0)
    p2 = Location(5, 0)
    assert math.isclose(p1.angle_to(p2), 0.0)

    # 3. Along negative X
    p2 = Location(-5, 0)
    assert math.isclose(p1.angle_to(p2), math.pi)

    # 4. Along positive Y
    p2 = Location(0, 5)
    assert math.isclose(p1.angle_to(p2), math.pi / 2)

    # 5. Along negative Y
    p2 = Location(0, -5)
    assert math.isclose(p1.angle_to(p2), -math.pi / 2)

    # 6. Diagonal (45 degrees)
    p2 = Location(1, 1)
    assert math.isclose(p1.angle_to(p2), math.pi / 4)

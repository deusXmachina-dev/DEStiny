import math

import pytest

from destiny_sim.agv.location import Location
from destiny_sim.agv.site_graph import GridSiteGraph


class TestGridSiteGraph:
    def test_grid_creation(self):
        # 3x3 grid, spacing 10
        grid = GridSiteGraph(width=3, height=3, spacing=10.0, diagonals=False)

        # Check corners
        assert grid.get_node_at(0, 0) is not None
        assert grid.get_node_at(0, 0).x == 0
        assert grid.get_node_at(0, 0).y == 0

        assert grid.get_node_at(2, 2) is not None
        assert grid.get_node_at(2, 2).x == 20
        assert grid.get_node_at(2, 2).y == 20

        # Check out of bounds
        assert grid.get_node_at(3, 3) is None
        assert grid.get_node_at(-1, 0) is None

    def test_connectivity_no_diagonals(self):
        grid = GridSiteGraph(width=3, height=3, spacing=10.0, diagonals=False)
        start = grid.get_node_at(0, 0)
        end = grid.get_node_at(1, 1)  # (10, 10)

        path = grid.shortest_path(start, end)
        # Path should be (0,0) -> (0,1) -> (1,1) OR (0,0) -> (1,0) -> (1,1)
        # Both have length 20.
        assert len(path) == 3  # Start, mid, End

        dist = grid.shortest_path_length(start, end)
        assert dist == 20.0

    def test_connectivity_with_diagonals(self):
        grid = GridSiteGraph(width=3, height=3, spacing=10.0, diagonals=True)
        start = grid.get_node_at(0, 0)
        end = grid.get_node_at(1, 1)

        path = grid.shortest_path(start, end)
        # Should go direct via diagonal
        assert len(path) == 2  # Start, End

        dist = grid.shortest_path_length(start, end)
        assert dist == pytest.approx(math.sqrt(200), 0.001)

    def test_large_grid(self):
        # Just to ensure it doesn't crash on creation
        grid = GridSiteGraph(width=10, height=10, spacing=1.0)
        assert grid.get_node_at(9, 9).x == 9.0
        assert grid.get_node_at(9, 9).y == 9.0

    def test_insert_location_replace(self):
        grid = GridSiteGraph(width=3, height=3, spacing=10.0)

        # Create a "Store" location (just a subclass or different instance for now)
        class Store(Location):
            pass

        store_loc = Store(10.0, 10.0)  # Exact match

        grid.insert_location(store_loc)

        # Check if get_node_at returns the new store
        current_node = grid.get_node_at(1, 1)
        assert isinstance(current_node, Store)
        assert current_node == store_loc

        # Check connectivity is preserved
        start = grid.get_node_at(0, 0)
        path = grid.shortest_path(start, store_loc)
        assert len(path) > 0
        assert path[-1] == store_loc

    def test_insert_location_new_stitch(self):
        grid = GridSiteGraph(width=3, height=3, spacing=10.0, diagonals=False)
        # Grid points: (0,0), (10,0), (20,0) ... (20,20)

        # Add a node at (5, 5) - clearly in the middle of (0,0), (10,0), (0,10), (10,10)
        new_loc = Location(5.0, 5.0)

        grid.insert_location(new_loc, connect_to_k_nearest=4)

        # Should be connected to (0,0), (10,0), (0,10), (10,10)
        # Distance to each is sqrt(5^2 + 5^2) = sqrt(50) ~= 7.07

        # Verify path from (0,0) to new_loc
        start = grid.get_node_at(0, 0)
        path = grid.shortest_path(start, new_loc)

        # Path: (0,0) -> (5,5)
        assert len(path) == 2
        assert path[1] == new_loc

        length = grid.shortest_path_length(start, new_loc)
        assert length == pytest.approx(math.sqrt(50), 0.001)

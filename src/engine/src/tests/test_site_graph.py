import math

import pytest

from destiny_sim.agv.location import Location
from destiny_sim.agv.site_graph import SiteGraph


class TestSiteGraph:
    def test_shortest_path_simple(self):
        site = SiteGraph()
        # A(0,0) -> B(10,0) -> C(10,10)
        # |                  ^
        # +------------------+
        # A -> C direct is sqrt(200)
        # A -> B -> C is 10 + 10 = 20

        loc_a = Location(0, 0)
        loc_b = Location(10, 0)
        loc_c = Location(10, 10)

        site.add_node(loc_a)
        site.add_node(loc_b)
        site.add_node(loc_c)

        site.add_edge(loc_a, loc_b)
        site.add_edge(loc_b, loc_c)
        site.add_edge(loc_a, loc_c)  # Shortcut

        path = site.shortest_path(loc_a, loc_c)
        # Should take the direct path A->C because sqrt(200) < 20
        assert len(path) == 2
        assert path[0] == loc_a
        assert path[1] == loc_c

        dist = site.shortest_path_length(loc_a, loc_c)
        assert dist == math.sqrt(200)

    def test_shortest_path_weighted(self):
        site = SiteGraph()
        loc_a = Location(0, 0)
        loc_b = Location(10, 0)
        loc_c = Location(20, 0)

        site.add_node(loc_a)
        site.add_node(loc_b)
        site.add_node(loc_c)

        # Override weights: A->B is super expensive (e.g. traffic)
        site.add_edge(loc_a, loc_b, weight=100.0)
        site.add_edge(loc_b, loc_c, weight=1.0)

        # Add another path A->D->C via a detour D
        loc_d = Location(0, 1)
        site.add_node(loc_d)
        site.add_edge(loc_a, loc_d, weight=1.0)
        site.add_edge(loc_d, loc_c, weight=1.0)

        path = site.shortest_path(loc_a, loc_c)
        # Should go A -> D -> C (cost 2) instead of A -> B -> C (cost 101)
        # Even though A->B->C is physically shorter/straight line,
        # the weights dictate the path
        assert path == [loc_a, loc_d, loc_c]

        length = site.shortest_path_length(loc_a, loc_c)
        assert length == 2.0

    def test_missing_nodes_or_paths(self):
        site = SiteGraph()
        loc_a = Location(0, 0)
        loc_z = Location(99, 99)  # Not added

        site.add_node(loc_a)

        # Path to non-existent node
        assert site.shortest_path(loc_a, loc_z) == []
        assert site.shortest_path_length(loc_a, loc_z) == float("inf")

        # Unreachable node
        loc_b = Location(10, 10)
        site.add_node(loc_b)
        # No edges added
        assert site.shortest_path(loc_a, loc_b) == []
        assert site.shortest_path_length(loc_a, loc_b) == float("inf")

    def test_duplicate_nodes(self):
        site = SiteGraph()
        loc_a = Location(0, 0)
        site.add_node(loc_a)

        # Same coordinates should raise ValueError
        loc_a_dup = Location(0, 0)
        with pytest.raises(ValueError):
            site.add_node(loc_a_dup)

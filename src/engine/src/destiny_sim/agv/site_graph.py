from typing import Dict, List, Optional

import rustworkx as rx

from destiny_sim.agv.location import Location
from destiny_sim.core.environment import RecordingEnvironment
from destiny_sim.core.rendering import RenderingInfo, SimulationEntityType
from destiny_sim.core.simulation_entity import SimulationEntity


class GridNode(SimulationEntity):
    def get_rendering_info(self) -> RenderingInfo:
        return RenderingInfo(entity_type=SimulationEntityType.GRID_NODE)


def _get_node_id_for_location(location: Location) -> str:
    return f"node_{location.x}_{location.y}"


class SiteGraph:
    """
    Represents the site map as a graph of locations (nodes) and connections (edges).
    Uses rustworkx for the underlying graph representation and search algorithms
    for high performance.
    """

    def __init__(self):
        # PyDiGraph is a directed graph.
        # We will store a dictionary as the node payload: {'location': location}
        self.graph = rx.PyDiGraph()
        self.node_indices: Dict[str, int] = {}

    def add_node(self, location: Location) -> None:
        """
        Add a node to the graph.

        :param location: The Location object associated with this node.
        """
        node_id = _get_node_id_for_location(location)

        if node_id in self.node_indices:
            raise ValueError(f"Node {node_id} already exists in the graph.")

        idx = self.graph.add_node({"location": location})
        self.node_indices[node_id] = idx

    def add_edge(
        self,
        source: Location,
        target: Location,
        weight: Optional[float] = None,
        bidirectional: bool = True,
    ) -> None:
        """
        Add an edge (connection) between two nodes.

        :param source: Source location.
        :param target: Target location.
        :param weight: Cost of the edge (e.g., distance).
            If None, Euclidean distance is calculated.
        :param bidirectional: If True, adds an edge in both directions.
        """

        source_id = _get_node_id_for_location(source)
        target_id = _get_node_id_for_location(target)

        if source_id not in self.node_indices:
            raise ValueError(f"Node {source_id} does not exist in the graph.")
        if target_id not in self.node_indices:
            raise ValueError(f"Node {target_id} does not exist in the graph.")

        source_idx = self.node_indices[source_id]
        target_idx = self.node_indices[target_id]

        if weight is None:
            weight = source.distance_to(target)

        # rustworkx edge payload can be anything, usually the weight or a dict
        # Here we store the weight directly or a dict if more props are needed?
        # For shortest path algos, it's easiest if the edge weight function extracts it.
        # We'll store a dict and provide a weight function.
        edge_data = {"weight": weight}

        self.graph.add_edge(source_idx, target_idx, edge_data)
        if bidirectional:
            self.graph.add_edge(target_idx, source_idx, edge_data)

    def shortest_path(
        self, source: Location, target: Location, weight_key: str = "weight"
    ) -> List[Location]:
        """
        Find the shortest path between source and target nodes.

        :param source: Start location.
        :param target: End location.
        :param weight_key: Dictionary key in edge data to use as weight.
        :return: List of Location objects representing the path.
        """
        source_id = _get_node_id_for_location(source)
        target_id = _get_node_id_for_location(target)

        if source_id not in self.node_indices or target_id not in self.node_indices:
            return []

        source_idx = self.node_indices[source_id]
        target_idx = self.node_indices[target_id]

        paths = rx.dijkstra_shortest_paths(
            self.graph,
            source_idx,
            target=target_idx,
            weight_fn=lambda edge: edge.get(weight_key, 1.0),
            default_weight=1.0,
        )

        try:
            path_indices = paths[target_idx]
        except (KeyError, IndexError):
            return []

        # Convert indices back to string IDs
        # accessing the 'id' field we stored in the node payload
        return [self.graph.get_node_data(idx)["location"] for idx in path_indices]

    def shortest_path_length(
        self, source: Location, target: Location, weight_key: str = "weight"
    ) -> float:
        """
        Find the length of the shortest path between source and target nodes.
        """
        source_id = _get_node_id_for_location(source)
        target_id = _get_node_id_for_location(target)

        if source_id not in self.node_indices or target_id not in self.node_indices:
            return float("inf")

        source_idx = self.node_indices[source_id]
        target_idx = self.node_indices[target_id]

        path_length = rx.dijkstra_shortest_path_lengths(
            self.graph,
            source_idx,
            lambda edge: edge.get(weight_key, 1.0),
            goal=target_idx,
        )
        try:
            return path_length[target_idx]
        except (KeyError, IndexError):
            return float("inf")

    def visualize_graph(self, env: RecordingEnvironment) -> None:
        """
        Visualize the graph nodes in the simulation.

        :param env: The simulation environment.
        """
        for node_data in self.graph.nodes():
            location = node_data["location"]
            # Create a visual entity for the node
            node_entity = GridNode()

            env.record_stay(entity=node_entity, x=location.x, y=location.y)


class GridSiteGraph(SiteGraph):
    """
    A SiteGraph that is initialized as a grid of nodes.
    """

    def __init__(self, width: int, height: int, spacing: float, diagonals: bool = True):
        """
        Initialize a grid-based site graph.

        :param width: Number of columns.
        :param height: Number of rows.
        :param spacing: Distance between adjacent nodes.
        :param diagonals: Whether to connect diagonal neighbors.
        """
        super().__init__()
        self.width = width
        self.height = height
        self.spacing = spacing
        self.diagonals = diagonals
        self._grid_locations: Dict[tuple[int, int], Location] = {}
        self._generate_grid()

    def _generate_grid(self):
        # Create nodes
        for r in range(self.height):
            for c in range(self.width):
                loc = Location(x=c * self.spacing, y=r * self.spacing)
                self.add_node(loc)
                self._grid_locations[(r, c)] = loc

        # Create edges
        for r in range(self.height):
            for c in range(self.width):
                current_loc = self._grid_locations[(r, c)]

                # Right neighbor
                if c < self.width - 1:
                    right_loc = self._grid_locations[(r, c + 1)]
                    self.add_edge(current_loc, right_loc)

                # Bottom neighbor
                if r < self.height - 1:
                    bottom_loc = self._grid_locations[(r + 1, c)]
                    self.add_edge(current_loc, bottom_loc)

                if self.diagonals:
                    # Bottom-right neighbor
                    if r < self.height - 1 and c < self.width - 1:
                        br_loc = self._grid_locations[(r + 1, c + 1)]
                        self.add_edge(current_loc, br_loc)

                    # Bottom-left neighbor
                    if r < self.height - 1 and c > 0:
                        bl_loc = self._grid_locations[(r + 1, c - 1)]
                        self.add_edge(current_loc, bl_loc)

    def get_node_at(self, row: int, col: int) -> Optional[Location]:
        """
        Get the Location object at the specified grid coordinates.
        """
        return self._grid_locations.get((row, col))

    def insert_location(
        self, location: Location, connect_to_k_nearest: int = 4
    ) -> None:
        """
        Insert a location into the graph.

        - If a node with the same coordinates already exists, it is replaced
          (preserving edges but updating the Location object).
        - If it is a new location, it is added as a new node and connected to the
          'connect_to_k_nearest' closest existing nodes.

        :param location: The Location to add.
        :param connect_to_k_nearest: Number of neighbors to connect to
            if it's a new node.
        """
        node_id = _get_node_id_for_location(location)

        if node_id in self.node_indices:
            # Case 1: Replace existing node
            idx = self.node_indices[node_id]
            self.graph[idx] = {"location": location}

            # Update _grid_locations if this matches a grid point
            # We calculate expected grid indices to check efficiently
            if self.spacing > 0:
                c = int(round(location.x / self.spacing))
                r = int(round(location.y / self.spacing))
                if (r, c) in self._grid_locations:
                    # Check if the existing one actually matches the ID we just replaced
                    existing = self._grid_locations[(r, c)]
                    if _get_node_id_for_location(existing) == node_id:
                        self._grid_locations[(r, c)] = location
        else:
            # Case 2: Add new node and connect to nearest
            # Gather candidates BEFORE adding the new node to avoid self-matching
            candidates = []
            for node_data in self.graph.nodes():
                other_loc = node_data["location"]
                dist = location.distance_to(other_loc)
                candidates.append((dist, other_loc))

            # Add the new node
            super().add_node(location)

            # Connect to k nearest
            candidates.sort(key=lambda x: x[0])
            for i in range(min(len(candidates), connect_to_k_nearest)):
                dist, target = candidates[i]
                self.add_edge(location, target, weight=dist)

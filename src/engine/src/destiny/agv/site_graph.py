import rustworkx as rx
from typing import List, Optional, Dict

from destiny.agv.location import Location


def _get_node_id_for_location(location: Location) -> str:
    return f"node_{location.x}_{location.y}"


class SiteGraph:
    """
    Represents the site map as a graph of locations (nodes) and connections (edges).
    Uses rustworkx for the underlying graph representation and search algorithms for high performance.
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

        idx = self.graph.add_node({'location': location})
        self.node_indices[node_id] = idx

    def add_edge(self, source: Location, target: Location, weight: Optional[float] = None, bidirectional: bool = True) -> None:
        """
        Add an edge (connection) between two nodes.
        
        :param source: Source location.
        :param target: Target location.
        :param weight: Cost of the edge (e.g., distance). If None, Euclidean distance is calculated.
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
        edge_data = {'weight': weight}
        
        self.graph.add_edge(source_idx, target_idx, edge_data)
        if bidirectional:
            self.graph.add_edge(target_idx, source_idx, edge_data)

    def shortest_path(self, source: Location, target: Location, weight_key: str = 'weight') -> List[Location]:
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

        # dijkstra_shortest_paths returns a dictionary of paths {target_idx: [source, ..., target]}
        paths = rx.dijkstra_shortest_paths(
            self.graph,
            source_idx,
            target=target_idx,
            weight_fn=lambda edge: edge.get(weight_key, 1.0),
            default_weight=1.0
        )

        try:
            path_indices = paths[target_idx]
        except (KeyError, IndexError):
            return []

        # Convert indices back to string IDs
        # accessing the 'id' field we stored in the node payload
        return [self.graph.get_node_data(idx)['location'] for idx in path_indices]

            
    def shortest_path_length(self, source: Location, target: Location, weight_key: str = 'weight') -> float:
        """
        Find the length of the shortest path between source and target nodes.
        """
        source_id = _get_node_id_for_location(source)
        target_id = _get_node_id_for_location(target)

        if source_id not in self.node_indices or target_id not in self.node_indices:
            return float('inf')

        source_idx = self.node_indices[source_id]
        target_idx = self.node_indices[target_id]

        path_length = rx.dijkstra_shortest_path_lengths(
            self.graph,
            source_idx,
            lambda edge: edge.get(weight_key, 1.0),
            goal=target_idx
        )
        try:
            return path_length[target_idx]
        except (KeyError, IndexError):
            return float('inf')

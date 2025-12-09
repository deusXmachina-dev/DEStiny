import os
from enum import Enum, unique

__all__ = ["RuntimeEnvironment", "get_runtime_environment"]


@unique
class RuntimeEnvironment(str, Enum):
    """Canonical names for the supported runtime environments."""

    LOCAL = "local"
    """Code is executed on a developer workstation (default)."""

    CI = "ci"
    """Code is executed inside a continuous-integration pipeline."""

    CLUSTER = "cluster"
    """Code is executed in a production-like Kubernetes cluster."""


def _is_ci() -> bool:
    """Return *True* if the current process is running inside CI.

    We follow the de-facto convention used by GitHub Actions, GitLab CI, and
    others, where the generic environment variable ``CI`` is set to "true".
    The check is case-insensitive and accepts common truthy values.
    """

    return os.getenv("CI", "").lower() in {"1", "true", "yes"}


def _is_cluster() -> bool:
    """Return *True* if the current process is running inside a k8s cluster.

    The heuristic relies on environment variables that are automatically
    injected by Kubernetes when a pod starts:

    * ``KUBERNETES_SERVICE_HOST`` – present in all pods
    """

    return "KUBERNETES_SERVICE_HOST" in os.environ


def get_runtime_environment() -> RuntimeEnvironment:
    """Detect and return the current :class:`RuntimeEnvironment`.

    The detection order is **CI → cluster → local** because CI containers often
    do *not* expose the Kubernetes variables even when they themselves run
    inside k8s, and a developer can always override CI by unsetting ``CI``.
    """

    if _is_ci():
        return RuntimeEnvironment.CI

    if _is_cluster():
        return RuntimeEnvironment.CLUSTER

    return RuntimeEnvironment.LOCAL

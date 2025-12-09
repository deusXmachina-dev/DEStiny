from utils.environment import RuntimeEnvironment, get_runtime_environment


def test_detects_ci(monkeypatch):
    """Environment is *CI* when the ``CI`` variable is truthy."""
    monkeypatch.setenv("CI", "true")
    monkeypatch.delenv("KUBERNETES_SERVICE_HOST", raising=False)

    assert get_runtime_environment() is RuntimeEnvironment.CI


def test_detects_cluster(monkeypatch):
    """Environment is *cluster* when k8s-specific variables are present."""
    monkeypatch.delenv("CI", raising=False)
    monkeypatch.setenv("KUBERNETES_SERVICE_HOST", "10.0.0.1")

    assert get_runtime_environment() is RuntimeEnvironment.CLUSTER


def test_defaults_to_local(monkeypatch):
    """Environment defaults to *local* when no special variables are set."""
    monkeypatch.delenv("CI", raising=False)
    monkeypatch.delenv("KUBERNETES_SERVICE_HOST", raising=False)

    assert get_runtime_environment() is RuntimeEnvironment.LOCAL

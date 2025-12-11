# DEStiny Engine - Agent Guidelines

SimPy-based discrete event simulation engine with Pydantic schemas for API integration.

## Tech Stack

SimPy 4.1+, Pydantic 2.0+, Rustworkx (graph algorithms), Python 3.11+

## Testing

**ALWAYS use `uv` to run tests.** The project uses `uv` for dependency management and test execution.

```bash
# Run all tests
uv run pytest

# Run specific test file
uv run pytest src/tests/test_builder_entity.py

# Run with verbose output
uv run pytest -v

# Run specific test
uv run pytest src/tests/test_builder_entity.py::test_human_schema_generation
```

**Important**: Tests are in `src/tests/` and the Python path is configured to `src/` in `pyproject.toml`, so imports use `destiny_sim.*` paths.

## Project Structure

```
engine/
├── src/
│   ├── destiny_sim/        # Main package
│   │   ├── builder/        # Builder entities and schemas
│   │   │   ├── entity.py   # BuilderEntity base class
│   │   │   ├── schema.py   # BuilderEntitySchema, ParameterType (Pydantic models)
│   │   │   ├── runner.py   # Blueprint execution
│   │   │   └── entities/   # Concrete entity implementations
│   │   ├── core/           # Core simulation components
│   │   │   ├── environment.py      # RecordingEnvironment
│   │   │   ├── simulation_entity.py # SimulationEntity base
│   │   │   ├── rendering.py        # SimulationEntityType enum
│   │   │   └── metrics.py           # Metrics recording
│   │   └── agv/            # AGV-specific entities
│   ├── tests/              # Test files
│   │   ├── test_builder_entity.py
│   │   ├── test_environment.py
│   │   └── ...
│   └── examples/           # Example simulations
```

## Key Rules

1. **Schema Definitions**:
   - `BuilderEntitySchema`, `ParameterType`, `Blueprint`, `BlueprintEntity`, `SimParams`, and `ParameterValue` are defined in `destiny_sim.builder.schema`
   - These are **Pydantic BaseModel** classes (not dataclasses) for compatibility with Django Ninja
   - The backend imports and uses these schemas directly - single source of truth
   - `run_blueprint()` accepts a `Blueprint` object directly, not a dictionary

2. **Entity Types**:
   - `SimulationEntityType` is a `StrEnum` in `destiny_sim.core.rendering`
   - Valid values: `AGV`, `ROBOT`, `BOX`, `PALETTE`, `SOURCE`, `SINK`, `BUFFER`, `HUMAN`, `COUNTER`, `GRID_NODE`, `EMPTY`
   - When creating test entities, use valid enum values, not arbitrary strings

3. **Builder Entities**:
   - All builder entities inherit from `BuilderEntity`
   - `get_parameters_schema()` returns a `BuilderEntitySchema` Pydantic model
   - The method inspects `__init__` signature and maps Python types to `ParameterType` enum

4. **Testing**:
   - Test entities must use valid `SimulationEntityType` enum values (Pydantic validates this)
   - Tests assert against structured types (`.entityType`, `.parameters`)
   - Always use `uv run pytest` - never use plain `pytest` or `python -m pytest`

5. **Dependencies**:
   - Pydantic is a core dependency (needed for schemas used by backend)
   - Engine is imported by backend as editable dependency

## Commands

```bash
# Run tests (ALWAYS use uv)
uv run pytest

# Run specific test file
uv run pytest src/tests/test_builder_entity.py -v

# Lint code
uv run ruff check .

# Format code
uv run ruff format .
```

## Import Paths

- Tests and code use `destiny_sim.*` imports (e.g., `from destiny_sim.builder.entity import BuilderEntity`)
- Python path is set to `src/` in `pyproject.toml`
- Package structure: `src/destiny_sim/` is the root package

## Schema Integration

The engine's `BuilderEntitySchema` is used directly by the backend API:
- No conversion needed - Pydantic models work with Django Ninja
- Backend imports: `from destiny_sim.builder.schema import BuilderEntitySchema`
- Single source of truth - no duplicate schemas

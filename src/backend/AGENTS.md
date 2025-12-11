# DEStiny Backend - Agent Guidelines

Django + Django Ninja API backend for the DEStiny simulation platform.

## Tech Stack

Django 6.0+, Django Ninja (Pydantic-based API framework), PostgreSQL (via psycopg), Python 3.12+

## Testing

**ALWAYS use `uv` to run tests.** The project uses `uv` for dependency management and test execution.

```bash
# Run all tests
uv run pytest

# Run specific test file
uv run pytest tests/test_api.py

# Run with verbose output
uv run pytest -v

# Run specific test
uv run pytest tests/test_api.py::TestSchemaEndpoint::test_get_schema_returns_list
```

**Important**: Tests require Django settings, which are configured via `DJANGO_SETTINGS_MODULE=settings.test_settings` in `pyproject.toml`. The test client is available via `pytest-django`.

## Project Structure

```
backend/
├── simulation/          # Main app
│   ├── api.py          # Django Ninja API endpoints
│   ├── schemas.py      # Pydantic/Ninja schemas (except BuilderEntitySchema - see engine)
│   └── models.py       # Django models (if any)
├── settings/           # Django settings
│   ├── settings.py     # Main settings
│   └── test_settings.py # Test settings
├── tests/              # Test files
│   ├── test_api.py     # API endpoint tests
│   └── utils/          # Test utilities
└── utils/              # Shared utilities
```

## Key Rules

1. **Schema Definitions**: 
   - `BuilderEntitySchema` and `ParameterType` are defined in the **engine** (`destiny_sim.builder.schema`), not in backend schemas
   - Backend imports and uses the engine's schema directly - no duplication
   - Other schemas (Blueprint, SimulationRecordingSchema, etc.) are in `simulation/schemas.py`

2. **Dependencies**:
   - The backend depends on the engine via `destiny-sim` (editable path dependency)
   - Engine schemas use Pydantic BaseModel, which works directly with Django Ninja

3. **API Endpoints**:
   - Use Django Ninja's `@api.get()` and `@api.post()` decorators
   - Response types can use Pydantic models directly (including from engine)
   - No manual conversion needed for engine schemas - they work directly with Ninja

4. **Testing**:
   - Use `pytest-django` fixtures and Django test client
   - Test settings are in `settings/test_settings.py`
   - Always use `uv run pytest` - never use plain `pytest` or `python -m pytest`

## Commands

```bash
# Run tests (ALWAYS use uv)
uv run pytest

# Run Django management commands
uv run python manage.py migrate
uv run python manage.py runserver

# Lint code
uv run ruff check .

# Format code
uv run ruff format .
```

## Dependencies

- **Engine dependency**: `destiny-sim` is an editable path dependency pointing to `../engine`
- **Dev dependencies**: Include `pytest-django` for Django test integration
- **All commands**: Must be run through `uv run` to ensure correct environment

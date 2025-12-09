# DEStiny Simulation Backend

Django backend for the DEStiny simulation engine. Provides REST API endpoints for:
- Fetching entity schemas for the frontend builder
- Running simulations from blueprints

## Starting the Backend

1. **Install dependencies**
   ```bash
   cd src/backend
   uv sync
   ```

2. **Start the development server**
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://localhost:8000/api/`

API documentation is available at `http://localhost:8000/api/docs`

## API Endpoints

- `GET /api/schema` - Returns entity schemas for the frontend builder
- `POST /api/simulate` - Runs a simulation from a blueprint and returns the recording

## Development

### Code Quality

```bash
# Format code
ruff format .

# Check linting
ruff check .
```

### Testing

```bash
# Run tests
pytest
```

## Project Structure

- `simulation/` - Main Django app containing the simulation API
- `settings/` - Django settings configuration
- `utils/` - Shared utility functions

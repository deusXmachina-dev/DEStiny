# Project Rules

## Package Management and Execution

This project uses `uv` for package management and running Python code. Always use `uv` instead of `pip`, `python`, or `python -m` directly.

### Running Commands

- **Run Python scripts**: Use `uv run <script>` instead of `python <script>`
- **Run tests**: Use `uv run pytest` instead of `pytest` or `python -m pytest`
- **Install dependencies**: Use `uv sync` (for syncing from pyproject.toml) or `uv add <package>` (for adding new packages)
- **Run any Python module**: Use `uv run python -m <module>` instead of `python -m <module>`

### Examples

- Run a script: `uv run src/destiny_sim/examples/agv_moving_a_box.py`
- Run tests: `uv run pytest`
- Run a specific test: `uv run pytest tests/test_simulation_entity.py`
- Install dev dependencies: `uv sync --dev` or `uv sync --all-groups`
- Add a new dependency: `uv add <package-name>`

### Virtual Environment

The project uses `uv`'s virtual environment management. The virtual environment is typically located at `.venv` and is automatically managed by `uv`. When running commands with `uv run`, the virtual environment is automatically activated.

### Important Notes

- Never use `pip install` directly - use `uv add` or `uv sync` instead
- Never use `python` directly - use `uv run python` or `uv run <script>` instead
- When suggesting commands to run, always prefix them with `uv run` if they involve Python execution


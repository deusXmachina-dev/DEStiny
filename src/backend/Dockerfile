# Use an official Python runtime as a parent image
FROM python:3.13-slim

# Install git and other system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install --no-cache-dir uv

# Set the working directory in the container to /backend
WORKDIR /backend

# Make sure that top level directories are included in the PYTHONPATH
ENV PYTHONPATH=/backend

# Copy engine to /engine (path dependency expects ../engine from /backend, which resolves to /engine)
COPY engine /engine

# Copy backend directory (including pyproject.toml, uv.lock and all source files)
COPY backend /backend

# Install backend dependencies using uv with all dependency groups (including dev)
# This ensures pytest-django and other dev dependencies are installed from the lockfile
RUN cd /backend && uv sync --all-groups --frozen

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Start Django with Gunicorn when the container launches
# Use uv run to execute commands within the virtual environment created by uv sync
CMD ["sh", "-c", "cd /backend && uv run python manage.py collectstatic --noinput && uv run gunicorn --bind 0.0.0.0:8080 --workers 4 --timeout 120 wsgi:application"]

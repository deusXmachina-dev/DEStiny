# Use an official Python runtime as a parent image
FROM python:3.13-slim

# Install git and other system dependencies
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container to /backend
WORKDIR /backend

# Make sure that top level directories are included in the PYTHONPATH
ENV PYTHONPATH=/backend

# Copy engine first (dependency)
COPY engine /backend/engine

# Copy backend directory (including pyproject.toml and all source files)
COPY backend /backend

# Install backend dependencies (this will install destiny-sim from the local engine path)
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -e /backend/engine && \
    pip install --no-cache-dir -e /backend

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Start Django with Gunicorn when the container launches
CMD ["sh", "-c", "python manage.py collectstatic --noinput && gunicorn --bind 0.0.0.0:8080 --workers 4 --timeout 120 wsgi:application"]

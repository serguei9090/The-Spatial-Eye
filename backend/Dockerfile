# Use a lightweight Python base image
FROM python:3.13-slim

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Ensure uv caches don't bloat the image
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Set the working directory
WORKDIR /app

# Install the universally mandated package manager for Python
RUN pip install uv

# Copy the dependency files first (for caching)
COPY pyproject.toml uv.lock ./

# Sync dependencies using uv (fast, deterministic installs)
RUN uv sync --frozen --no-dev

# Copy the rest of the application code
COPY . .

# Expose the port Cloud Run uses
EXPOSE 8000

# Start the FastAPI server using the environment created by uv
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

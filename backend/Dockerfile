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

# Create a non-privileged user and install uv
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser \
    && chown -R appuser:appgroup /app \
    && pip install --no-cache-dir uv==0.10.8

# Copy the dependency files first (for caching)
COPY --chown=appuser:appgroup pyproject.toml uv.lock ./

# Sync dependencies using uv (fast, deterministic installs)
RUN uv sync --frozen --no-dev

# Copy the rest of the application code
COPY --chown=appuser:appgroup . .

# Switch to the non-privileged user
USER appuser

# Expose the port Cloud Run uses
EXPOSE 8000

# Health check to ensure the FastAPI server is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')" || exit 1

# Start the FastAPI server using the environment created by uv
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

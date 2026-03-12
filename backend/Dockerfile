# --- Stage 1: Build dependencies ---
FROM python:3.13-slim AS builder

WORKDIR /app

# Install uv for fast dependency management
RUN pip install --no-cache-dir uv==0.10.8

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Sync dependencies into a virtual environment
RUN uv sync --frozen --no-dev

# --- Stage 2: Final Runtime ---
FROM python:3.13-slim AS runner

WORKDIR /app

# Copy the virtual environment from the builder
COPY --from=builder /app/.venv /app/.venv

# Copy the application code
COPY . .

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Expose the port Cloud Run will use
EXPOSE 8000

# Start the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Backend Rules and Standards
This document outlines the strict guidelines and references for the Python backend in the Spatial Eye project.

## Environment and Tooling
- **OS**: Windows (PowerShell is the default shell).
- **Package Manager**: `uv` is the strict standard. Do not use direct `pip` or standard `python -m venv` commands unless specifically circumventing a `uv` limitation, which requires justification.
- **Python Version**: >= 3.13.

## uv Usage on Windows
All package management and command execution must be run through `uv`.

### Commands
- **Install/Sync**: Run `uv sync` to install dependencies listed in `pyproject.toml`.
- **Add Dependencies**: Run `uv add <package>` (or `uv add --dev <package>`).
- **Run Modules**: Run Python scripts via `uv run python script.py`.
- **Run Servers**: Execute uvicorn servers using `uv run uvicorn main:app --port 8000`. If `fastapi[standard]` is installed, `uv run fastapi dev main.py` is permitted, though standard `uvicorn` avoids missing extra dependencies.

### Virtual Environments
- The virtual environment is managed by `uv` automatically in the `.venv` folder. When you use `uv run <cmd>`, it transparently executes within that environment. You do not formally need to `.\.venv\Scripts\Activate.ps1`.

## Python Linting & Formatting
- **Tool**: `ruff`.
- `ruff` is installed as a development group dependency.
- Configuration is strictly maintained within `pyproject.toml` (e.g., `[tool.ruff]`, `[tool.ruff.lint]`).
- Do not make format checks a blocking script if it disrupts the workflow. Fix them manually via `uv run ruff check --fix .` and `uv run ruff format .` inside the backend directory.

## Architecture
- All routing and streaming logic runs through FastAPI and `websockets`.
- Integration to Google ADK requires `.env.local` API Keys mapped to initialization configurations, avoiding duplicating keys across frontend and backend.

# Gemini Context: The Spatial Eye

## Project Overview

**The Spatial Eye** is a real-time, multimodal AI assistant built as a submission for the "Gemini Live Agent Challenge (Hakentoch)". It uses the **Gemini 2.5 Live API** to create a high-fidelity cognitive link between the user's physical reality and AI intelligence. The application is a full-stack project with a Next.js frontend, a Python (FastAPI) backend, and is deployed on Google Cloud Platform using Terraform for IaC and GitHub Actions for CI/CD.

The application features three distinct operational modes:
1.  **🔵 Spatial Live:** The AI analyzes a live camera feed and can highlight and identify real-world objects with surgical precision.
2.  **📖 Creative Storyteller:** Transforms physical objects seen by the camera into vivid, interleaved narratives accompanied by AI-generated storyboard images.
3.  **🖧 IT Architecture:** Listens to a user's verbal project ideas and generates interactive, evolving IT architecture diagrams in real time using ReactFlow.

The project is architected for resilience, featuring a robust error-handling system that provides specific user notifications (toasts) when different AI models are unavailable due to billing issues or quota limits.

## Tech Stack

| Category | Technology | Notes |
| :--- | :--- | :--- |
| **Frontend** | [Next.js](https://nextjs.org/) 15 (React 19) | App Router, TypeScript |
| **Backend** | [Python](https://www.python.org/) 3.13+ with [FastAPI](https://fastapi.tiangolo.com/) | Serves backend logic, run with `uvicorn`. |
| **Package Manager** | [Bun](https://bun.sh/) (Frontend), [uv](https://github.com/astral-sh/uv) (Backend) | |
| **AI/ML** | [Gemini 2.5 Live API](https://ai.google.dev/gemini-2-5/api/multimodal-live-api) | Core for audio/video streaming & interaction. |
| | `@google/genai` SDK | Client-side interaction with Gemini APIs. |
| **UI** | [shadcn/ui](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/), Radix UI | Component-based UI library. |
| | [Framer Motion](https://www.framer.com/motion/) & [TSParticles](https://particles.js.org/) | Animations and background effects. |
| **Diagrams** | [ReactFlow](https://reactflow.dev/) | For the IT Architecture mode. |
| **Authentication** | [Firebase Auth](https://firebase.google.com/docs/auth) | Google Sign-In. |
| **Database** | [Firestore](https://firebase.google.com/docs/firestore) | Session memory and persistence. |
| **Deployment** | [Google Cloud Run](https://cloud.google.com/run) | Automated via GitHub Actions. |
| **IaC** | [Terraform](https://www.terraform.io/) / [Pulumi](https://www.pulumi.com/) | `IaC/` directory contains infrastructure code. |
| **Testing** | [Jest](https://jestjs.io/), [React Testing Library](https://testing-library.com/react) | Unit and component testing. |
| **Linting/Formatting**| [BiomeJS](https://biomejs.dev/) (Frontend), [Ruff](https://docs.astral.sh/ruff/) (Backend) | Enforced via `lefthook` pre-commit hooks. |

## Building and Running

### Prerequisites

*   **Bun:** `npm install -g bun`
*   **uv (Python):** `pip install uv`
*   **Google Gemini API Key**
*   **Firebase Project**

### 1. Installation

Install all frontend and backend dependencies.

```bash
# Install frontend node modules
bun install
```

### 2. Environment Configuration

Create a local environment file from the example and populate it with your API keys and Firebase project details.

```powershell
# For Windows
Copy-Item .env.example .env.local

# For macOS/Linux
cp .env.example .env.local
```

### 3. Running the Development Servers

The application consists of a Next.js frontend and a FastAPI backend. Both can be run concurrently.

```bash
# Start the Next.js frontend dev server (http://localhost:3000)
bun run dev

# In a separate terminal, start the FastAPI backend dev server (http://localhost:8000)
bun run backend:dev
```
*Note: `bun run backend:dev` is a convenience script in the root `package.json` that executes `uv run uvicorn main:app` within the `/backend` directory.*

### 4. Validation & Testing

The project is equipped with commands for linting, formatting, and testing. These are enforced by `lefthook` before each commit.

```bash
# Run linter
bun run lint

# Run all unit & component tests
bun test

# Run a production build check
bun run build
```

## Development Conventions

*   **Atomic Design:** The `components/` directory is structured using atomic design principles (`atoms`, `molecules`, `organisms`, `templates`).
*   **Centralized AI Logic:** All Gemini-related logic is centralized in the `lib/gemini/` directory. This includes a model registry (`registry.ts`), mode-specific tool handlers, and a robust error classification system (`model-error.ts`).
*   **Custom Hooks:** Core functionality is abstracted into custom hooks like `useGeminiCore` (for WebSocket session management) and `useGeminiLive` (for A/V integration).
*   **Error Handling:** A global error handler (`useGlobalErrorHandler`) catches unhandled promise rejections and uses a centralized notification function (`notifyModelError`) to display user-friendly toasts when a specific Gemini model fails.
*   **Git Hooks:** `lefthook` is configured in `lefthook.yml` to run Biome and Ruff on pre-commit, ensuring code quality and consistency.
*   **Documentation:** The `architecture.md` file contains detailed Mermaid diagrams outlining all major data flows and system interactions.

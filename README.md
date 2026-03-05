# 👁️ The Spatial Eye

> **Gemini Live Agent Challenge (Hackathon) Submission**
> A real-time multimodal AI assistant that sees, listens, and acts — built entirely with the **Gemini 2.5 Live API**.

### ⚠️ Legal & Educational Disclaimer
* **Purpose:** This repository is an academic and competitive submission for the **Gemini Live Agent Challenge (Hakentoch)**. It is intended to showcase architectural patterns using the Gemini Live API.
* **Non-Commercial:** This is a non-commercial prototype. No services are being sold, and no unauthorized employment is being conducted through this project.
* **License:** Open-sourced under the **MIT License** for community educational purposes.

## 👥 The Team
- **[Cinthya Rodriguez](https://github.com/crhdez)** — *Team Leader & Representative* (Primary hackathon competitor and sole prize-eligible applicant). [GDG Profile](https://developers.google.com/profile/u/crhdez)
- **[Serguei Castillo](https://github.com/serguei9090)** — *Developer Collaborator* (Participating strictly for educational/learning purposes. Explicitly listed as ineligible to receive any cash prizes or hackathon compensation). [GDG Profile](https://developers.google.com/profile/u/serguei9090)

[![Built with Antigravity](https://img.shields.io/badge/Built%20with-Antigravity%20IDE-6366f1?style=flat-square&logo=googlegemini&logoColor=white)](https://antigravity.dev)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20Live-4285F4?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Deployed on GCP](https://img.shields.io/badge/Deployed%20on-Google%20Cloud-4285F4?style=flat-square&logo=googlecloud&logoColor=white)](https://cloud.google.com)

---

## 🧠 The Problem

Users face significant barriers when interacting with complex physical environments:

1. **Information Asymmetry** — In specialized settings (mechanical repairs, hardware configurations, surgical setups), users often struggle to match verbal instructions to physical objects.
2. **Cognitive Overload** — Purely audio or text-based assistants require users to mentally translate "look at the red cable" into their 3D field of view.
3. **Lack of Grounded Feedback** — Most AI interactions are disconnected from the user's immediate physical reality.

## 💡 The Solution

**The Spatial Eye** creates a high-fidelity cognitive link between the user's physical reality and AI intelligence. Using the **Gemini 2.5 Live API**, it provides **Spatial Live** assistance:

| Feature | Description |
|---------|-------------|
| 🔵 **Spatial Live** | AI circles and highlights real objects directly on the live camera feed with surgical precision in real-time. |

---

## 🏗️ Architecture

```
Browser (Next.js 15)
  ├─ Camera + Microphone → Fast API Backend Server → Gemini 2.5 Live API (WebSocket)
  ├─ Audio/Video Stream  → AI responses (audio + tool calls)
  ├─ Mode Handlers       → UI updates (spatial overlays)
  └─ Connection Menu     → Dynamically connects users via Bring Your Own Key (API Auth)
         ↓
Google Cloud Platform
  ├─ Firebase Auth       → User authentication
  ├─ Firestore           → Session memory
  └─ Cloud Run + Terraform → Automated deployment
```

> 🗺️ **[View the full System Flowchart and Architecture Diagrams here (`architecture.md`)](./docs/submission/architecture.md)**

---

## 🤖 AI Models Used

| Role | Model | Display Name |
|------|-------|-------------|
| Live audio + video session | `gemini-2.5-flash-native-audio-preview-12-2025` | Gemini 2.5 Flash Native Audio |
| *Out of Scope / Disabled* | `gemini-2.5-flash-image`, `veo-3.1...` | *(Image and Video models are disabled for this presentation)* |

> Model registry with rate limits: [`lib/gemini/registry.ts`](./lib/gemini/registry.ts)

---

## ⚡ Quick Start

### Prerequisites
- **Bun** (package manager) — `npm install -g bun`
- A **Google Gemini API Key** — [Get one here](https://aistudio.google.com/apikey)
- A **Firebase Project** — [Create one here](https://console.firebase.google.com/)

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

```powershell
Copy-Item .env.example .env.local
```

Fill in `.env.local`:

```env
# Gemini (required)
NEXT_PUBLIC_GOOGLE_API_KEY=AIza...

# Firebase (required)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=

# Firebase Admin (for server-side ephemeral token minting)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=   # replace \n with actual newlines

# Model overrides (optional — defaults from registry.ts)
NEXT_PUBLIC_GEMINI_LIVE_MODEL=
NEXT_PUBLIC_GEMINI_MODEL_IMAGE=
```

### 3. Start development server

```bash
bun run dev
```

Opens at `http://localhost:3000`.

### 4. Validate

```bash
bun x biome check .       # lint
bun test                   # unit tests
bun run build              # production build check
```

---

## 📁 Project Structure

```
app/                    Next.js App Router pages (/, /studio, /settings, /sessions)
components/
  atoms/                Foundational UI (buttons, badges, placeholders)
  molecules/            Functional groups (device selector, coordinate display)
  organisms/            Complex sections (ControlBar, CreativeStudio, ITArchitectureStudio)
  templates/            Page layouts (StudioLayout)
  providers.tsx         Context tree + global error listener
lib/
  gemini/
    registry.ts         Model metadata / rate limits (source of truth)
    models.ts           Resolved model ID constants
    model-error.ts      🆕 Centralized model error classification + toast
    handlers.ts         Spatial mode tool call handler
  hooks/
    useGeminiCore.ts    Live WebSocket session management
    useGeminiLive.ts    Gemini Live integration (audio + video)
    useGlobalErrorHandler.ts  Window-level error → named model toast
  api/                  WebSocket helpers
  firebase/             Firebase init
  firestore/            Session and detection persistence
  types.ts              Shared TypeScript types
docs/
  submission/          Event-specific documentation (Architecture, Deployment, Presentation)
IaC/                    Terraform (GCP deployment infrastructure)
__tests__/              Jest + React Testing Library
```

---

## 🚀 Roadmap & Future Extensions

While the core presentation focus is **Spatial Live**, the platform is architected for a broader vision:

| Module | Status | Description |
|--------|--------|-------------|
| 📖 **Creative Storyteller** | Research Lab | Transforms physical objects into vivid interleaved narratives with AI-generated storyboards. |
| 🖧 **IT Architecture** | Beta | Generates real-time, interactive IT architecture diagrams from verbal project brainstorming. |
| ⚡ **Action Execution** | Concept | Connecting spatial detection to home automation and industrial control loops. |

---

## 🛡️ Resilience Features

The app stays functional even when models are unavailable (billing, quota limits):

- **Named model toasts** — when any Gemini model fails, a floating notification names the specific model (e.g. *"Nano Banana is not available — Billing issue or quota exceeded"*) rather than a generic error.
- **Image placeholders** — if Nano Banana can't generate a storyboard image, a clean inline SVG placeholder replaces it so the story card layout stays intact.
- **Global error coverage** — the `useGlobalErrorHandler` intercepts any unhandled promise rejection in the app, classifies it, and routes model errors through the same named-toast system.

---

## ☁️ Cloud Deployment (GCP)

Infrastructure is fully automated via Terraform in `IaC/terraform/`.

```bash
cd IaC/terraform
terraform init
terraform apply
```

CI/CD via GitHub Actions (`.github/workflows/deploy.yml`) — pushes to `main` automatically build and deploy to **Cloud Run**.

---

## 🏆 Hackathon Challenge Compliance

| Requirement | Status |
|-------------|--------|
| Uses Gemini Live API | ✅ |
| Hosted on Google Cloud | ✅ Firebase + Cloud Run |
| Public repo | ✅ `.env` gitignored |
| Architecture diagram | ✅ [`docs/submission/architecture.md`](./docs/submission/architecture.md) |
| Proof of GCP deployment | ✅ [`IaC/terraform/`](./IaC/terraform) & [`docs/submission/DEPLOYMENT.md`](./docs/submission/DEPLOYMENT.md) |
| Automated CI/CD | ✅ GitHub Actions |
| Landing page | ✅ Particle-animated hero at `/` |
| Demo video | ⚠️ Record `< 4 min` walkthrough |

**Category**: Live Agents

---

## 🔑 Authentication Flow

1. User signs in with **Firebase Google Auth** (App authentication)
2. User provides their **Gemini AI Studio API key** in the UI Connection Settings (Bring Your Own Key)
3. Backend mints a short-lived **ephemeral session token** mapped to the Auth session
4. Browser opens a Secure WebSocket (`/ws/live`) to the Python FastAPI Backend passing the auth token and dynamic API key.
5. The backend validates the user and securely routes the streaming connection to Google AI Studio. **The user's BYOK API key is NEVER saved to a database or environment file on our server.**

---

## 🛠️ Built With Antigravity IDE

This project was developed end-to-end using **[Antigravity IDE](https://antigravity.dev)** — an AI-powered agentic coding environment by Google Deepmind. Antigravity was used for:

- Architecture design and atomic component scaffolding
- Implementing all Gemini Live API integration logic
- Refactoring and linting enforcement (Biome, TypeScript strict)
- Generating the full error handling and model notification system
- Writing all architecture diagrams and documentation

> *"Pair programming with an AI agent that understands your full codebase end-to-end."*

---

## 📚 References

- [Gemini Live API Docs](https://ai.google.dev/gemini-2-5/api/multimodal-live-api)
- [Google GenAI SDK](https://www.npmjs.com/package/@google/genai)
- [Next.js 15](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Antigravity IDE](https://antigravity.dev)

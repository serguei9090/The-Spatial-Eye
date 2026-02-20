# 👁️ The Spatial Eye

> **Gemini Live Agent Challenge (Hakentoch) Submission**
> A real-time multimodal AI assistant that sees, listens, and acts — built entirely with the **Gemini 2.5 Live API**.

[![Built with Antigravity](https://img.shields.io/badge/Built%20with-Antigravity%20IDE-6366f1?style=flat-square&logo=googlegemini&logoColor=white)](https://antigravity.dev)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20Live-4285F4?style=flat-square&logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Deployed on GCP](https://img.shields.io/badge/Deployed%20on-Google%20Cloud-4285F4?style=flat-square&logo=googlecloud&logoColor=white)](https://cloud.google.com)

---

## 🧠 The Problem

Users face three critical barriers when interacting with the physical world through AI:

1. **Troubleshooting Overload** — In complex environments (car engines, server racks), purely verbal AI instructions are hard to follow. Users need to *see* exactly what to touch.
2. **Disconnected Creativity** — Turning real-world objects into a child's story requires immediate visual and narrative synthesis that text-only AI can't provide.
3. **Static Technical Design** — IT specialists lose momentum when project ideas can't be converted into structured architecture diagrams in real time.

## 💡 The Solution

**The Spatial Eye** uses the **Gemini 2.5 Live API** to create a high-fidelity cognitive link between the user's reality and AI intelligence — via three specialized modes:

| Mode | What it does |
|------|-------------|
| 🔵 **Spatial Live** | AI circles and highlights real objects directly on the live camera feed with surgical precision |
| 📖 **Creative Storyteller** | Transforms physical objects into vivid interleaved narratives + AI-generated storyboard images |
| 🖧 **IT Architecture** | Listens to verbal project ideas and generates interactive, evolving architecture diagrams in real time |

---

## 🏗️ Architecture

```
Browser (Next.js 15)
  ├─ Camera + Microphone → Gemini 2.5 Live API (WebSocket)
  ├─ Audio/Video Stream  → AI responses (audio + tool calls)
  ├─ Mode Handlers       → UI updates (overlays / diagrams / story cards)
  └─ Error System        → Named model-unavailability toasts (sonner)
         ↓
Google Cloud Platform
  ├─ Firebase Auth       → User authentication
  ├─ Firestore           → Session memory
  └─ Cloud Run + Terraform → Automated deployment
```

> Full diagram set (Live session flow, error handling, image generation, provider tree): [`architecture.md`](./architecture.md)

---

## 🤖 AI Models Used

| Role | Model | Display Name |
|------|-------|-------------|
| Live audio + video session | `gemini-2.5-flash-native-audio-preview-12-2025` | Gemini 2.5 Flash Native Audio |
| Storyboard image generation | `gemini-2.5-flash-image` | Nano Banana |
| Brand copy + reasoning | `gemini-2-flash` | Gemini 2 Flash |
| High-throughput background tasks | `gemini-2.5-flash-lite` | Gemini 2.5 Flash Lite |
| Video synthesis | `veo-3.1-fast-generate-preview` | Veo 3.1 Fast Generate *(disabled, free-tier)* |

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
    storyteller-handlers.ts  Storyteller mode + image generation
    it-architecture-handlers.ts  IT Architecture diagram tool calls
  hooks/
    useGeminiCore.ts    Live WebSocket session management
    useGeminiLive.ts    Gemini Live integration (audio + video)
    useGlobalErrorHandler.ts  Window-level error → named model toast
  api/                  WebSocket helpers
  firebase/             Firebase init
  firestore/            Session and detection persistence
  types.ts              Shared TypeScript types
IaC/                    Terraform + Pulumi (GCP deployment)
__tests__/              Jest + React Testing Library
```

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

## 🏆 Hakentoch Challenge Compliance

| Requirement | Status |
|-------------|--------|
| Uses Gemini Live API | ✅ |
| Hosted on Google Cloud | ✅ Firebase + Cloud Run |
| Public repo | ✅ `.env` gitignored |
| Architecture diagram | ✅ [`architecture.md`](./architecture.md) |
| Proof of GCP deployment | ✅ [`IaC/terraform/`](./IaC/terraform) |
| Automated CI/CD | ✅ GitHub Actions |
| Landing page | ✅ Particle-animated hero at `/` |
| Demo video | ⚠️ Record `< 4 min` walkthrough |

**Category**: Live Agents + Creative Storyteller

---

## 🔑 Authentication Flow

1. User signs in with **Firebase Google Auth**
2. User provides their own **Gemini API key** in Settings
3. Backend mints a short-lived **ephemeral token** per session
4. Browser uses the ephemeral token for Live API WebSocket auth
5. User's API key is **never stored** on our servers

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

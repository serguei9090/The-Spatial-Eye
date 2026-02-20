# 2026 Improvements Strategy for Gemini Live API Integration

After analyzing the `useGeminiCore.ts` and `useGeminiLive.ts` codebase alongside the latest Google Cloud documentation (ADK Bidi-streaming, Way Back Home, and Survivor Network codelabs), here are the critical architectural improvements to elevate this app to production-grade standards in 2026.

## 1. Migrate from Client-Side to a Backend Relay (Bidi-Streaming Agent)
**Current State:** 
The application establishes a direct WebSocket connection from the React frontend to the Gemini Live API (`@google/genai`), exposing `NEXT_PUBLIC_GOOGLE_API_KEY` to the client.

**The Improvement:**
Follow the **Agent Development Kit (ADK)** pattern to introduce a secure backend (e.g., Node.js or Python/FastAPI) that acts as a relay.
* **Security:** Hides the Google API Key and internal tool configurations from the browser.
* **Stability:** The frontend streams media via standard WebSockets/WebRTC to your backend, and the backend handles the high-bandwidth, bi-directional stream to Gemini. This will significantly reduce the `1006` (Connection Drops) and "deadline exceeded" errors currently handled by your hackintosh-specific retry logic.
* **Deployment:** Deploy the backend on Google Cloud Run, as recommended in the *Way Back Home* codelab.

## 2. Multi-Agent Orchestration & Dispatch Hub
**Current State:** 
`useGeminiLive.ts` swaps out giant `systemInstruction` strings based on an application `mode` state (`spatial`, `storyteller`, `it-architecture`).

**The Improvement:**
Implement a **Dispatch Agent (A2A - Agent-to-Agent)** architecture.
* Have a single "Front-Door" Agent that the client talks to. 
* Use **Agent-as-a-Tool** routing logic (from *Way Back Home Level 4*) to delegate tasks dynamically to specialized sub-agents (e.g., an `Architect Agent` for IT diagrams, a `Director Agent` for the Storyteller stream).
* This keeps system instructions focused, reduces token overhead, and limits tool hallucination.

## 3. Implement Robust Server-Side Memory Banks & Graph RAG
**Current State:**
Session recovery is currently handled by injecting a `resumePrompt` into a new connection, dumping the names of `MAX_RESUME_NODES=8` into the prompt. 

**The Improvement:**
Adopt the **Memory Bank** and **Graph RAG** patterns from the *Survivor Network* codelab.
* Shift the state management (e.g., the IT architecture nodes and edges) to a backend database (Google Cloud Spanner or Redis "Schematic Vault").
* When the WebSocket connection drops, your backend can automatically rehydrate the agent with the exact schema history and session memory without overloading the WebSocket handshake frame with massive string arrays.

## 4. Proactive Background Monitoring Tools
**Current State:** 
The application relies purely on the user talking (reactive prompts) or sending video frames for the AI to respond.

**The Improvement:**
Introduce **Streaming Tools / Background Monitors**. 
* As demonstrated in the ADK guides, you can connect a stream analyzer that constantly processes the video feed in the background. If a specific spatial event is recognized (e.g., "A new AWS component was drawn" or "Hazard detected in spatial environment"), the backend proactively triggers an alert or tool call into the Live Agent's context without waiting for user audio input.

## 5. Sequential Multimodal Data Pipeline
**Current State:**
Video frames (`image/jpeg`) and Audio chunks (`audio/pcm;rate=16000`) are blindly fired off to the active WebSocket session using `session.sendRealtimeInput`.

**The Improvement:**
The *Survivor Network* codelab highlights moving away from brittle, direct media pumping toward an agentic sequential pipeline.
* Create a dedicated media handling layer in the backend that orchestrates the media upload, extracts features, and then pushes structured data to the Live API.
* Syncing audio and video streams through a backend buffer ensures frame consistency and allows you to decouple the recording framerate from the API ingestion rate.

---

### Suggested Next Action
I recommend starting with **Phase 1: Building an ADK-powered Backend Relay**. This immediately solves the API key exposure and provides a sturdier foundation to fix the transient WebSocket interruptions you've been battling. Would you like me to draft an implementation plan for creating this backend?

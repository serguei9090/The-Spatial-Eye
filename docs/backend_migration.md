# Backend Migration Plan

## Objective
Re-introduce the Python backend iteratively by incrementally decoupling the audio processing, session orchestration, and tool handling from the existing React frontend. The primary goal is to safely restore the backend for advanced tool execution without breaking the working frontend implementation. Note that we must be extremely careful with the audio format for strict Voice Activity Detection (VAD) compliance under Google's Agent Development Kit (ADK).

## Step 1: Prepare the Proper Environment
**Status:** [Finished and Tested]
The backend will utilize modern Python tooling entirely.

1. **Initialize Project:** Create an isolated Python project inside the `backend/` directory using `uv init`. 
2. **Environment Variables:** Load configuration directly from the root `../.env.local` to utilize existing keys without duplication (e.g., `NEXT_PUBLIC_GEMINI_LIVE_MODEL`, `NEXT_PUBLIC_GOOGLE_API_KEY`).
3. **Dependencies:** Install strictly what is needed using `uv add`:
   - `fastapi` and `uvicorn` for the server interface.
   - `python-dotenv` to parse the root `.env.local` file.
   - `google-genai` and `google-adk` (Agent Development Kit) for routing logic.
   - `websockets` for frontend linkage.
4. **Code Quality:** Configure `ruff` linting rules within `pyproject.toml`. No direct `pip` or standard `venv` will be used based on global standards.

## Step 2: Implement Audio Relay (Bidi-Streaming)
**Status:** [Finished and Tested]
Based on Google's ADK Bidi-streaming specifications, we must construct a highly reliable WebSocket multiplexer. VAD demands precise handling of audio modalities.

1. **Endpoint Initialization:** Mount a WebSockets endpoint (e.g. `ws://localhost:8000/ws/live`) inside `backend/main.py`.
2. **Session Configuration:** For each connection, declare a `RunConfig`:
   - `streaming_mode`: Set to `StreamingMode.BIDI`.
   - `response_modalities`: Explicitly set to `["AUDIO"]` to enable native voice responses.
   - Include `input_audio_transcription` and `output_audio_transcription` configurations.
3. **Queue Creation:** Instantiate a distinct `LiveRequestQueue` for every individual user session (queues are strictly non-reusable to prevent race conditions or cross-talk).
4. **Upstream Task (Receive):** Map incoming PCM audio blobs from the frontend into `types.Content` with accurate MIME formats, and invoke `LiveRequestQueue.send_content()`. 
5. **Downstream Task (Transmit):** Run an asynchronous loop yielding responses from `runner.run_live()`. Serialize these events and map them back strictly as WebSocket payloads out to the frontend client.
6. **Graceful Cleanup:** Guarantee concurrent task shutdown inside a `try...finally` block. `live_request_queue.close()` MUST be called upon termination to end session processes correctly.

## Step 3: Shift Orchestration & Tool Definitions
**Status:** [In Progress]
Once bidirectional audio is seamlessly routing through the local relay without dropouts, the next step involves moving the execution orchestration out of the frontend.

1. Migrate tool configurations (`SPATIAL_TOOLS`, `DIRECTOR_TOOLS`, `IT_ARCHITECTURE_TOOLS`) from TypeScript to Python tool functions within the ADK.
2. Route `toolCall` notifications as JSON messages through the downstream task straight into frontend state managers so the UI dynamically reacts to tool invocations (`activeHighlights`, `nodes`, `edges`).

## Step 4: Refactor Frontend Application (`useGeminiCore.ts`)
**Status:** [Finished and Tested]
The existing frontend (`lib/hooks/useGeminiCore.ts`) currently instantiates the `@google/genai` SDK natively in the browser and points directly to `wss://generativelanguage.googleapis.com`. This must change entirely to a localized relay approach:

1. **Remove Frontend SDK dependency:** Eliminate `GoogleGenAI` from `useGeminiCore.ts`. Replace it with a standard browser `WebSocket` connecting directly to `ws://localhost:8000/ws/live`.
2. **Audio Processing Changes (Sending):** 
   - Currently, `sendAudioChunk()` base64-encodes an `Int16Array` (16kHz) and wraps it inside a `session.sendRealtimeInput({ media: ... })` JSON object.
   - We must transmit the base64-encoded string (or raw bytes) cleanly to the Python `upstream_task` so that the ADK `types.Content` wrapper can be constructed strictly on the Python side.
3. **Audio Processing Changes (Receiving):** 
   - The frontend currently decodes `msg.serverContent.modelTurn.parts` dynamically. 
   - The Python `downstream_task` will forward `runner.run_live()` events down the wire as JSON. The frontend `onMessage` handler must strictly parse these JSON strings, extract the base64 audio chunks, and queue them into the existing `audioContextRef`. 
4. **Tool Execution:** 
   - The Python `LiveRequestQueue` handles the tools internally now. The backend will transmit custom `Event` payloads back down the WebSocket when UI state updates are needed (e.g., rendering a highlight or an architecture node).
   - The frontend merely acts as a "dumb UI terminal" listening for visualization instructions.

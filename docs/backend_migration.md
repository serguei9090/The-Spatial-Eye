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
**Status:** [Finished and Tested - Spatial Mode]
The execution orchestration has been moved to the backend. Spatial awareness is now handled by the Python relay.

1. migrated tool configurations (`SPATIAL_TOOLS`) to Python functions in `backend/tools_config.py`.
2. `toolCall` notifications are routed as JSON straight into the frontend state manager.
3. Verified `track_and_highlight` successfully triggers UI highlights from the backend.

## Step 4: Refactor Frontend Application (`useGeminiCore.ts`)
**Status:** [Finished and Tested]
The frontend has been successfully decoupled from the `@google/genai` SDK and now communicates exclusively with the local Python relay.

1. **Removed Frontend SDK dependency:** Use standard `WebSocket` for communication.
2. **Audio Processing (Sending/Receiving):** Verified bidirectional PCM streaming.
3. **Tool Execution:** Frontend now acts as a reactive terminal for backend-triggered tool calls.

## Step 5: Refine Creative Storyteller (Director) Mode
**Status:** [Finished and Tested - Narrative Ready]
Transitioned Storyteller functionality to backend orchestration and resolved critical display issues.

1. **DIRECTOR_TOOLS Mapping:** Integrated `render_visual`, `segment_story`, and `define_world_rule` into the Python relay.
2. **Resolved "Narrative Silence":** Improved `useGeminiLive.ts` to intelligently detect narrative context even when markers are missing. Relaxed `useGeminiCore.ts` transcript finality checks to ensure smooth streaming.
3. **Image Generation:** Verified `render_visual` triggers the secondary pipeline; currently using optimized `Nano Banana` (Gemini 2.5 Flash Image) for storyboard frames.

## Step 6: IT Architecture Mode & Final Polish
**Status:** [Next]
1. Migrate `IT_ARCHITECTURE_TOOLS` to backend.
2. Verify ReactFlow integration via the relay.
3. Final production build and validation.

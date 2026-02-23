# Gemini Live Orchestration & Architecture

## 1. Overview
The Spatial Eye is powered by Google's **Gemini Multimodal Live API**, enabling real-time, bidirectional interaction with audio, video, and text. This document serves as the "Brain" for the project's AI integration.

## 2. Core Architecture

### Connection Protocol
- **Transport**: WebSocket (wss://Generativelanguage.googleapis.com/v1beta/...)
- **Authentication**: 
  - **Dev/Hackathon**: Direct API Key (`NEXT_PUBLIC_GOOGLE_API_KEY`).
  - **Production TARGET**: Ephemeral Tokens (currently bypassed due to API instability).

### Active Model
- **Model ID**: `gemini-2.0-flash-exp` (or `gemini-2.0-flash-thinking-exp` for complex tasks).
- **Modalities**: 
  - **Input**: Audio (PCM 16kHz), Video (Base64 Frames), Text (System Instructions).
  - **Output**: Audio (PCM), Text (JSON Transcripts).

## 3. Implementation Details

### Client-Side Hooks (`lib/hooks/useGeminiLive.ts`)
- **`connect()`**: Establishes the WebSocket handshake.
- **`sendAudioChunk()`**: Streams microphone input (resampled or raw blob).
- **`sendVideoFrame()`**: Captures video frames at adaptive FPS (2-5fps typical).
- **`disconnect()`**: Gracefully closes socket and cleans up MediaStreams.

### Server-Side (Next.js API Routes)
- **`api/gemini/key`**: Securely handles user-provided API keys (stored in HttpOnly cookies ideally, currently localStorage for hackathon speed).
- **`api/gemini/ephemeral-token`**: (Legacy/Future) Endpoint for minting short-lived session tokens.

## 4. "The Spatial Eye" Modes (Roadmap)

### Mode A: Live Conversation (Current)
- **Goal**: Natural, fluid conversation about the visual environment.
- **Status**: ✅ Functional.
- **Key Feature**: "Talk and Circle" - User points camera, AI describes world.

### Mode B: Creative Storyteller (Planned)
- **Goal**: Weave narratives based on visual input.
- **Integration**:
    1. Capture Frame -> Gemini Vision (Description).
    2. Description -> Gemini Pro (Story Generation).
    3. Story -> Imagen 3 (Illustration) + Text-to-Speech.
- **Status**: 🚧 Pending.

### Mode C: UI Navigator (Planned)
- **Goal**: Identify and interact with UI elements or physical objects.
- **Integration**:
    1. Receive `BBox` (Bounding Box) data from Gemini.
    2. Draw on `<SpatialOverlay />` canvas.
- **Status**: 🚧 In Progress (Canvas layer exists).

## 5. Troubleshooting & Limits
- **Quotas**: `gemini-2.0-flash-exp` has strict rate limits. Handle `429` errors gracefully.
- **Latency**: Optimize video frame size (JPEG 70% quality, max 640px) to reduce bandwidth.
- **Audio Echo**: Ensure `AudioContext` handles echo cancellation (AEC) via browser APIs.

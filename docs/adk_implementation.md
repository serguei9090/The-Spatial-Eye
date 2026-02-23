# Gemini Live Implementation Process (ADK Migration)

This document outlines the architectural shift from a manual WebSocket relay to using the **Google Agent Development Kit (ADK)** to power the multimodal interactions in *The Spatial Eye*.

## 1. Core Technology Stack (Backend)

The migration involved moving away from a custom multi-threaded relay to a more robust, state-of-the-art Python stack:

*   **Library:** `google-adk` (Version 1.25.1+)
*   **Reasoning:** The ADK provides high-level abstractions for "Agents," "Runners," and "LiveRequestQueues." It handles the complex interleaving of audio chunks, video frames, and tool calls which was previously prone to race conditions and 1008/1007 WebSocket errors.
*   **Dependencies:**
    *   `google-genai`: The primary Python SDK for interacting with Gemini 2.x models.
    *   `fastapi`: For the WebSocket ingestion layer.
    *   `websockets`: For robust duplex communication.

## 2. Documentation & Resources

The following resources were utilized to design the current implementation:

1.  **Google ADK Python Samples:** [github.com/google/adk-python](https://github.com/google/adk-python)
    *   *Reference applied:* Using the `Agent` class and `Runner` for session management.
2.  **Google Python-GenAI SDK Reference:** [googleapis.github.io/python-genai](https://googleapis.github.io/python-genai/genai.html#module-genai.live)
    *   *Reference applied:* Understanding `BidiGenerateContent` and the structure of `types.Blob` for multimodal inputs.
3.  **Gemini Live API Multimodal Reference:** [ai.google.dev/gemini-2-5/api/multimodal-live-api](https://ai.google.dev/gemini-2-5/api/multimodal-live-api)
    *   *Reference applied:* Correcting the WebSocket payload structures for "realtimeInput" (specifically separating `media` for audio and `video` for images).

## 3. Key Improvements

### A. The "Blindness" Fix (Multimodal Pipeline)
The previous implementation was only relaying audio. We updated the `upstream_task` to handle JSON payloads from the React frontend that contain:
- `realtimeInput.media`: Encapsulating base64 audio blocks.
- `realtimeInput.video`: Encapsulating base64 image/video frames.

### B. Tool Call Stabilization
By using the ADK's `LiveRequestQueue`, tool calls like `track_and_highlight` are now handled as structured functional responses rather than raw text parsing. This increased reliability for the **Spatial Mode**.

### C. Backend Session Isolation
The `InMemorySessionService` from ADK was implemented to ensure that each WebSocket connection has a unique, isolated `Agent` session, preventing state bleeding between user attempts.

---
**Date Published:** February 23, 2026  
**Implementation Team:** Antigravity AI

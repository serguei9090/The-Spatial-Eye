---
name: spatial-eye-gemini-live
description: Implement, debug, and harden Gemini Multimodal Live API integration for The Spatial Eye, including WebSocket session setup, MediaRecorder audio, periodic frame streaming, coordinate extraction, and reconnection behavior. Use when working in live API hooks, realtime message parsing, or streaming reliability fixes.
---

# Spatial Eye Gemini Live

Load `references/live-api-cheatsheet.md` before implementation or debugging.

## Workflow

1. Verify environment input:
- Read `NEXT_PUBLIC_GOOGLE_API_KEY` from client environment.
- Fail fast with actionable UI feedback if the key is missing.
2. Establish secure WebSocket session:
- Use `wss://generativelanguage.googleapis.com/google.ai.generativelanguage.v1alpha.GenerativeService/BidiGenerateContent?key={API_KEY}`.
- Track connection state in hook state and UI.
3. Stream media deliberately:
- Capture video frames from hidden canvas every 500-1000ms.
- Send media payloads as base64 with explicit mime type.
- Keep throughput near 1-2 fps unless a task requires higher cadence.
4. Parse and validate model output:
- Extract `[ymin, xmin, ymax, xmax]` coordinates from text/tool output.
- Reject malformed values and any value outside 0-1000.
- Emit normalized highlights for overlay rendering.
5. Harden reliability:
- Implement exponential backoff reconnect.
- Surface connection failures in toast/UI state.
- Preserve last known good highlights when transient failures occur.

## Required Prompt Contract

Embed this behavior in the system instruction whenever prompts are modified:

`When identifying objects, output coordinates in the format [ymin, xmin, ymax, xmax] normalized to 0-1000 range.`

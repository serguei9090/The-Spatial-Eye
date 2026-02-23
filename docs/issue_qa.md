# Spatial Eye - Issue Q&A (Troubleshooting Summary)

This document tracks recent critical issues encountered during the Gemini Live API integration and the specific fixes implemented.

---

### 1. AI "Blindness" (No Object Interaction)
**Issue:** The AI could hear the user but was unable to "see" objects to highlight them, even with the camera active.
**Cause:** The backend relay in `main.py` was only looking for the `realtimeInput.media` key (audio) and completely ignoring the `realtimeInput.video` key in the incoming JSON stream.
**Solution:** Updated the `upstream_task` in `backend/main.py` to correctly decode and forward `video` blobs to the ADK `LiveRequestQueue`.

### 2. Tool Calls Not Rendering Highlights
**Issue:** The logs showed the AI was calling `track_and_highlight`, and the backend returned "Success," but no circles appeared on the frontend.
**Cause:** 
- **Frontend Key Mismatch:** `useGeminiCore.ts` was sending video data under the `media` key instead of `video`.
- **Argument Structure:** The Google ADK sends tool arguments (like `center_x`) directly at the top level of the `args` object, whereas the legacy frontend code was looking for a nested `objects: []` array.
**Solution:** 
- Updated `useGeminiCore.ts` to use the correct `video` key.
- Refactored `handleSpatialToolCall` in `lib/gemini/handlers.ts` to support both direct top-level arguments and nested object arrays.

### 3. Coordinate Leakage (Verbalizing Numbers)
**Issue:** The AI was speaking numerical coordinates aloud (e.g., "The cup is at 500, 600") instead of silently highlighting.
**Cause:** The System Instructions were not strict enough about "Silent Execution" and "Chain of Thought" suppression for the newer Gemini 2.5 Preview models.
**Solution:** Hardened the `SPATIAL_SYSTEM_INSTRUCTION` in `tools_config.py` with explicit protocols to forbid verbalizing coordinates or internal reasoning.

### 4. Duplicate Transcript Output
**Issue:** Every time the AI spoke, the transcript appeared twice in the UI chat box.
**Cause:** The frontend was processing both "partial" and "final" transcript messages from the relay without de-duplication.
**Solution:** Modified `lib/hooks/useGeminiCore.ts` to only call `onTranscript` when a message is marked as `finished: true` or when the turn is specifically flagged as `partial: false`.

### 5. WebSocket 1008 (Policy Violation) Errors
**Issue:** Sessions would occasionally drop with a `1008` error shortly after starting.
**Cause:** Often caused by sending incompatible modalities (e.g., audio-only model receiving video frames) or using an older API version (`v1alpha`) with a model requiring `v1beta`.
**Solution:** 
- Standardized on `v1beta` URL structures.
- Ensured multimodal inputs are correctly labeled so the model doesn't reject the stream.
- Reverted to `gemini-2.5-flash-native-audio-preview-12-2025` with proper frame interleaving.

---
**Last Updated:** February 23, 2026

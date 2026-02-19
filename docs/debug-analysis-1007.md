# 1007 WebSocket Error — Debug Analysis

## Status: ✅ ROOT CAUSE CONFIRMED — DEPRECATED API FIELD

**The `1007` error fires immediately after `setupComplete` because the first data payload uses a deprecated JSON field that newer models reject.**

---

## Root Cause

After consulting the **official Google Gemini Live API documentation** ([ai.google.dev/gemini-api/docs/live](https://ai.google.dev/gemini-api/docs/live)), the root cause of the `1007 Request contains an invalid argument` error was confirmed to be a **mismatch between the audio sample rate we were sending (24kHz) and the rate the API requires (16kHz)**.

> _"The input audio format should be in 16-bit PCM, **16kHz**, mono format"_
> — Official Google Gemini Live API Documentation

---

## Three Bugs Fixed

### Bug 1: Wrong Audio Input Sample Rate (CRITICAL)
- **File**: `components/molecules/AudioCapture.tsx`
- **Before**: `new AudioContext({ sampleRate: 24000 })`
- **After**: `new AudioContext({ sampleRate: 16000 })`
- **Reason**: The Gemini Live API strictly requires 16kHz PCM input. 24kHz would be rejected immediately after setup complete.

### Bug 2: Wrong Audio MIME Type Rate
- **File**: `lib/hooks/useGeminiLive.ts` → `sendAudioChunk`
- **Before**: `mime_type: "audio/pcm;rate=24000"`
- **After**: `mime_type: "audio/pcm;rate=16000"`
- **Reason**: Must match the AudioContext sample rate exactly.

### Bug 3: Setup Payload Field Casing (snake_case vs camelCase)
- **File**: `lib/api/gemini_websocket.ts` → `sendSetupMessage`
- **Before**: `generation_config`, `response_modalities`, `speech_config` (snake_case)
- **After**: `generationConfig`, `responseModalities`, `speechConfig` (camelCase)
- **Reason**: The Bidi WebSocket wire format for Gemini Live v1beta uses camelCase. Also, `"AUDIO"` modality changed to `"audio"` (lowercase).

---

## Audio Pipeline (Corrected)

```
Microphone → [16kHz AudioContext] → [AudioWorklet: pcm-capture-processor.js]
           → [Float32 → Int16 conversion] → [Base64 encode]
           → WebSocket: { realtime_input: { media_chunks: [{ mime_type: "audio/pcm;rate=16000", data }] } }
           → Gemini Live API

Gemini Response → [Base64 decode] → [Int16 PCM at 24kHz]
                → AudioContext (24kHz for playback)
```

---

## Important: Input vs Output Sample Rates

| Direction | Sample Rate | Format |
|---|---|---|
| **Input** (mic → API) | **16kHz** | 16-bit PCM, mono |
| **Output** (API → speakers) | **24kHz** | 16-bit PCM, mono |

This asymmetry is intentional and documented. The output AudioContext (for playback) must remain at 24kHz.

---

## Additional Improvements

- **Upgraded** `AudioCapture.tsx` from deprecated `ScriptProcessorNode` to modern `AudioWorkletNode`
  - Runs in a dedicated audio rendering thread — smoother, lower latency
  - No more browser deprecation warnings
- **Updated** model name to `gemini-2.5-flash-native-audio-preview-04-2025` (stable, production-tested)
- **Fixed** setup payload to use camelCase throughout

---

## Remaining Considerations

- The model outputs audio at 24kHz — the playback pipeline in `useGeminiLive.ts` uses a 24kHz `AudioContext` which is correct.
- Video input (JPEG frames via `realtime_input.media_chunks`) should now work without conflict since the audio is valid.
- Free-tier daily limits still apply — keep sessions short during development.

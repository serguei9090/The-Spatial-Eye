# Live API Cheatsheet

## Connection

- Use client API key: `NEXT_PUBLIC_GOOGLE_API_KEY`.
- Connect with:
  `wss://generativelanguage.googleapis.com/google.ai.generativelanguage.v1alpha.GenerativeService/BidiGenerateContent?key={API_KEY}`
- Keep explicit state: `connecting`, `open`, `error`, `closed`.

## Outbound Media Payload

```json
{
  "realtime_input": {
    "media_stream": {
      "mime_type": "video/webp",
      "data": "<base64 frame>"
    }
  }
}
```

## Cadence

- Capture and send frames every 500-1000ms.
- Target 1-2 fps unless the feature explicitly needs more.

## Coordinate Parsing

- Parse `[ymin, xmin, ymax, xmax]` from text or tool output.
- Enforce numeric values.
- Enforce each value `>= 0` and `<= 1000`.
- Drop invalid boxes where max is not greater than min.

## Reconnect Strategy

- Start backoff near 500ms.
- Double delay each failure up to a bounded cap.
- Reset delay after successful reconnect.

## Error Surface

- Show user-visible error toast for connection and auth failures.
- Log technical details to console for debugging.
- Keep last successful highlights until fresh valid detections arrive.

# Architecture Diagrams — The Spatial Eye

> **Source of truth** for all system data flows in the application.
> Generated: 2026-02-20

---

## 1. High-Level System Overview

```mermaid
graph TD
    subgraph Browser ["Browser (Client)"]
        UI["UI Layer\n(Atomic Design)"]
        Hooks["Custom Hooks\n(useGeminiCore, useGeminiLive)"]
        ErrorSys["Error System\n(model-error.ts + useGlobalErrorHandler)"]
        Store["State / Context\n(SettingsContext, AudioDeviceContext)"]
    end

    subgraph AICore ["AI Core (lib/gemini)"]
        Registry["Model Registry\n(registry.ts)"]
        Models["Model IDs\n(models.ts)"]
        Handlers["Mode Handlers\n(storyteller, it-architecture, spatial)"]
        Tools["Function Calling Tools\n(tools.ts)"]
        ModelErr["notifyModelError\n(model-error.ts)"]
    end

    subgraph External ["External Services"]
        GeminiLive["Gemini Live API\n(WebSocket — wss://)"]
        GeminiREST["Gemini REST API\n(generateContent)"]
        Firebase["Firebase\n(Auth + Firestore)"]
    end

    UI -->|"User actions"| Hooks
    UI -->|"Reads"| Store
    Hooks -->|"WebSocket"| GeminiLive
    Hooks -->|"Tool calls"| Handlers
    Handlers -->|"REST calls"| GeminiREST
    Handlers -->|"On error"| ModelErr
    Hooks -->|"On error"| ModelErr
    ModelErr -->|"Reads names"| Registry
    ModelErr -->|"Sonner toast"| UI
    Registry -->|"IDs"| Models
    Models -->|"Used by"| Hooks
    Store <-->|"Sync"| Firebase
    ErrorSys -->|"Unhandled rejections"| ModelErr
```

---

## 2. Gemini Live Session Flow (All Modes)

```mermaid
sequenceDiagram
    participant User
    participant ControlBar
    participant useGeminiCore
    participant GeminiLive as Gemini Live API (WSS)
    participant ModeHandler as Mode Handler
    participant UI

    User->>ControlBar: Press "Start"
    ControlBar->>useGeminiCore: connect()
    useGeminiCore->>GeminiLive: WebSocket open (model, systemInstruction, tools)
    GeminiLive-->>useGeminiCore: onopen → isConnected = true
    useGeminiCore-->>UI: isConnected = true (orb goes green)

    loop Session Active
        User->>useGeminiCore: speak / show camera
        useGeminiCore->>GeminiLive: sendRealtimeInput (audio PCM + JPEG frame)
        GeminiLive-->>useGeminiCore: onmessage (audio parts + tool calls + transcript)
        useGeminiCore->>ModeHandler: onToolCall(toolCall)
        ModeHandler-->>UI: setState (nodes / storyStream / highlights)
        useGeminiCore-->>UI: onTranscript(text)
    end

    User->>ControlBar: Press "End"
    ControlBar->>useGeminiCore: disconnect()
    useGeminiCore->>GeminiLive: session.close()
    GeminiLive-->>useGeminiCore: onclose
    useGeminiCore-->>UI: isConnected = false
```

---

## 3. Error Handling & Model Notification System

```mermaid
flowchart TD
    A([Any Gemini API Error]) --> B{Where caught?}

    B -->|"Explicit try/catch\nin handlers / hooks"| C[notifyModelError\nlib/gemini/model-error.ts]
    B -->|"Unhandled promise rejection\n(future callsites)"| D[useGlobalErrorHandler\nlib/hooks/useGlobalErrorHandler.ts]

    D --> E{isModelApiError?}
    E -->|Yes| F[extractModelId from message]
    F --> C
    E -->|No| G{WebSocket error?}
    G -->|Yes| H["toast.error: 'Connection error'"]
    G -->|No| I["toast.error: generic message"]

    C --> J{classifyError}
    J -->|RESOURCE_EXHAUSTED\nquota / 429| K["kind = rate_limit\n⏱ 6 s toast"]
    J -->|billing / 403\npermission / forbidden| L["kind = billing\n⏱ 10 s toast"]
    J -->|not found / 404\ndoes not exist| M["kind = not_found\n⏱ 10 s toast"]
    J -->|anything else| N["kind = generic\n⏱ 10 s toast"]

    K & L & M & N --> O[resolveDisplayName\n→ GEMINI_REGISTRY lookup]
    O --> P["sonner toast.error\nid: model-error-{model-id}\ntitle: '{Model Name} is not available'\ndescription: kind-specific message"]

    style C fill:#1e3a5f,color:#93c5fd
    style D fill:#1e3a5f,color:#93c5fd
    style P fill:#4c1d95,color:#c4b5fd
```

### Error Classification Reference

| `kind` | Triggers | Toast Duration |
|--------|----------|----------------|
| `rate_limit` | `RESOURCE_EXHAUSTED`, `quota`, `rate`, `429`, `too many requests` | 6 s |
| `billing` | `billing`, `403`, `permission`, `forbidden`, `access denied` | 10 s |
| `not_found` | `not found`, `404`, `does not exist` | 10 s |
| `generic` | Everything else | 10 s |

### Coverage Points in `useGeminiCore.ts`

| Hook Path | Error Source | Action |
|-----------|-------------|--------|
| `checkModelAvailability` | HTTP 403 / invalid key | `notifyModelError` + `modelAvailability = "unavailable"` |
| `onerror` callback | SDK error during session | `notifyModelError` + `modelAvailability = "unavailable"` |
| `onclose` (code 1008) | WS policy violation (billing) | `notifyModelError` + `modelAvailability = "unavailable"` |
| `.catch` on connect | Network/auth failure | `notifyModelError` + `modelAvailability = "unavailable"` |

---

## 4. Storyteller Mode — Image Generation Flow

```mermaid
sequenceDiagram
    participant GeminiLive as Gemini Live (WSS)
    participant StoryHandler as storyteller-handlers.ts
    participant NanoBanana as Nano Banana\n(gemini-2.5-flash-image REST)
    participant StoryStream as Story Stream UI
    participant ErrorSys as model-error.ts

    GeminiLive->>StoryHandler: toolCall → render_visual(subject, visual_context)
    StoryHandler->>StoryStream: Add card (isGenerating: true, SVG placeholder)
    StoryHandler->>NanoBanana: generateContent(cinematic prompt)

    alt Success
        NanoBanana-->>StoryHandler: inlineData (base64 image)
        StoryHandler->>StoryStream: Update card → base64 image URL
    else Failure (billing / quota / not found)
        NanoBanana-->>StoryHandler: Error thrown
        StoryHandler->>ErrorSys: notifyModelError(GEMINI_MODELS.imageSynthesis, error)
        ErrorSys-->>StoryStream: Sonner toast "Nano Banana is not available"
        StoryHandler->>StoryStream: Update card → inline SVG placeholder\n(dark themed, keeps layout intact)
    end
```

---

## 5. IT Architecture Mode — Diagram Update Flow

```mermaid
sequenceDiagram
    participant User
    participant useGeminiCore
    participant GeminiLive as Gemini Live (WSS)
    participant ArchHandler as it-architecture-handlers.ts
    participant ReactFlow as ReactFlow Canvas

    User->>useGeminiCore: "Design a 3-tier AWS app"
    useGeminiCore->>GeminiLive: sendRealtimeInput (audio)
    GeminiLive-->>useGeminiCore: toolCall → update_diagram(nodes[], edges[])
    useGeminiCore->>ArchHandler: handleArchitectureToolCall()
    ArchHandler->>ReactFlow: setNodes(newNodes) + setEdges(newEdges)
    ReactFlow-->>User: Canvas updates live
    GeminiLive-->>useGeminiCore: transcript (verbal explanation)
    useGeminiCore-->>User: onTranscript → AI Transcript overlay
```

---

## 6. Spatial Mode — Object Detection Flow

```mermaid
sequenceDiagram
    participant Camera as Webcam / Camera
    participant StudioLayout
    participant useGeminiCore
    participant GeminiLive as Gemini Live (WSS)
    participant SpatialHandler as handlers.ts
    participant Overlay as Spatial Overlay

    loop Every ~500ms while connected
        Camera->>StudioLayout: Video frame (canvas capture)
        StudioLayout->>useGeminiCore: sendVideoFrame(base64, "image/jpeg")
        useGeminiCore->>GeminiLive: sendRealtimeInput {media: image/jpeg}
    end

    GeminiLive-->>useGeminiCore: toolCall → track_and_highlight(objects[])
    useGeminiCore->>SpatialHandler: handleSpatialToolCall()
    SpatialHandler->>Overlay: setActiveHighlights(validObjects)
    Overlay-->>Camera: Animated SVG circles overlaid on feed
```

---

## 7. Provider / Context Tree

```mermaid
graph TD
    ThemeProvider --> SettingsProvider
    SettingsProvider --> AuthProvider
    AuthProvider --> AudioDeviceProvider
    AudioDeviceProvider --> GlobalErrorListener
    AudioDeviceProvider --> TooltipProvider
    TooltipProvider --> AppChildren["App Children\n(StudioLayout, Landing, etc.)"]
    TooltipProvider --> Toaster["Toaster\n(position: top-right, richColors)"]

    GlobalErrorListener -.->|"mounts"| useGlobalErrorHandler
    useGlobalErrorHandler -.->|"window.onerror\nunhandledrejection"| ModelErr["notifyModelError"]
    ModelErr -.->|"fires"| Toaster
```

---

## 8. Model Registry

```mermaid
graph LR
    subgraph registry.ts
        live["live\nGemini 2.5 Flash Native Audio\n1 RPM · Unlimited RPD"]
        image["image\nNano Banana\n500 RPM · 2K RPD"]
        video["video\nVeo 3.1 Fast Generate\n2 RPM · 10 RPD"]
        reasoning["reasoning\nGemini 2 Flash\n2K RPM · Unlimited RPD"]
        lowCost["lowCost\nGemini 2.5 Flash Lite\n4K RPM · Unlimited RPD"]
    end

    subgraph models.ts
        liveModel["liveAudioVideoSession"]
        imageModel["imageSynthesis"]
        videoModel["videoSynthesis"]
        brandModel["brandCopyAndSearch"]
        ttsModel["tts"]
    end

    live --> liveModel
    image --> imageModel
    video --> videoModel
    reasoning --> brandModel

    liveModel -->|"used by"| useGeminiCore
    imageModel -->|"used by"| storytellerHandlers["storyteller-handlers.ts"]
    videoModel -->|"disabled\n(VIDEO_SYNTHESIS_DISABLED)"| N/A
```

---

## Key File Map

| File | Role |
|------|------|
| `lib/gemini/model-error.ts` | Centralized error classification + toast |
| `lib/gemini/registry.ts` | Model metadata / display names |
| `lib/gemini/models.ts` | Resolved model ID constants |
| `lib/hooks/useGeminiCore.ts` | Live WebSocket session management |
| `lib/hooks/useGlobalErrorHandler.ts` | Window-level unhandled error/rejection handler |
| `lib/gemini/handlers.ts` | Spatial mode tool call handler |
| `lib/gemini/storyteller-handlers.ts` | Storyteller mode tool calls + image gen |
| `lib/gemini/it-architecture-handlers.ts` | IT Architecture mode tool calls |
| `components/providers.tsx` | Context tree + GlobalErrorListener mount |
| `components/ui/sonner.tsx` | Toast renderer (Sonner, top-right, richColors) |

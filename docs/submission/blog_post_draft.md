# Building "The Spatial Eye": Grounding Gemini 2.5 Live in Physical Reality

*Disclaimer: Created for the purposes of entering the Gemini Live Agent Challenge.*

What happens when an AI assistant doesn't just listen to your voice, but actually *sees* exactly what you see, continuously, in real-time?

For the **Gemini Live Agent Challenge**, we built **The Spatial Eye**—an open-source, multimodal AI assistant designed to bridge the gap between complex physical environments and agentic AI. 

In this post, we'll dive into the architecture of the application, how we used the new Gemini 2.5 Multimodal Live API via the Agent Development Kit (ADK), and how we deployed a unified architecture to Google Cloud Run.

---

## The Problem: Information Asymmetry

In specialized settings—whether it's mechanical repairs, a surgical setup, or debugging a complex hardware configuration—users often struggle to match an AI's text or verbal instructions to their physical 3D field of view. 

If an AI says "look at the red cable," you still have to mentally translate that to your environment. Purely audio-based assistants impose a massive cognitive load on the user because they lack grounded, continuous spatial feedback.

## The Solution: Spatial Live Mode

**The Spatial Eye** creates a high-fidelity cognitive link between the user's physical reality and the AI. Our primary feature, **Spatial Live**, uses the camera feed to allow the Gemini 2.5 model to physically "point out" objects.

When you ask the AI to identify a part, it doesn't just describe it verbally. It streams back an agentic tool call containing the bounding box coordinates, allowing our Next.js frontend to draw animated SVG circles directly onto the live camera feed with surgical precision.

---

## The Architecture: A Unified Gateway Pattern

To ensure low latency and seamless multimodal streaming, we orchestrated a Next.js 15 frontend and a FastAPI (Python) backend using the **Google Agent Development Kit (ADK)**. 

### Why a Custom Backend Relay?
We didn't want the frontend to communicate directly with the Gemini API for two reasons:
1. **Security**: We needed to implement a "Bring Your Own Key" (BYOK) system without exposing user keys in browser memory or risking abuse.
2. **State Grounding**: We use a `LiveRequestQueue` in Python to constantly inject contextual spatial prompts, ensuring the model never hallucinates objects from 5 minutes ago.

### Securing the WebSocket with Firebase
Here's how our flow works:
1. The user logs in via **Firebase Google Auth**.
2. Our Next.js API securely mints a short-lived **Ephemeral JWT Session Token** using the Firebase Admin SDK.
3. The browser opens a Secure WebSocket (`/ws/live`) to the Python FastAPI server.
4. The Python server validates the token, and then securely routes the real-time audio (PCM) and video (JPEG frames) straight into the Gemini 2.5 Flash Native Audio model.

![Architecture Flow](https://raw.githubusercontent.com/serguei9090/The-Spatial-Eye/main/docs/submission/screenshots/architecture.png) *(Note: insert real image link here)*

---

## Orchestrating the ADK

The magic happens in how we handle the `google.adk.Agent`. Because The Spatial Eye relies heavily on exact vision accuracy, we needed to configure the `RunConfig` tightly.

### 1. Bidi-Streaming
We configured the ADK to use `StreamingMode.BIDI`, capturing the raw 16kHz PCM audio stream from the browser's `AudioWorklet` directly to the model, and piping Gemini's audio parts back to the frontend for instant playback.

### 2. Contextual Forgetting
Video context consumes tokens rapidly. 15k tokens is barely a minute of video memory. If a user moves to a new room, Gemini might still claim it sees the "blue couch" from the previous room. To fix this, we added a manual "context reset" that intercepts the `LiveRequestQueue` and injects a `[SYSTEM RESET]` prompt, forcing the model to clear its spatial memory and analyze only the most recent frame.

---

## Deployment: Automating Cloud Run

To bring this all together, we deployed the application to **Google Cloud Platform (GCP)**.

To keep the application highly responsive, we used a **Unified Gateway Pattern** in our `Dockerfile`. Rather than deploying two separate Cloud Run services (which incurs extra cold start penalties and network hops), we bundled the built Next.js App and the Python Uvicorn server into a single container. A tiny gateway routes `/ws/` traffic to Python on port `8000`, and everything else to Next.js on `3001`.

Using **GitHub Actions** and **Workload Identity Federation**, every commit to `main` securely builds the Docker container, pushes it to Google Artifact Registry, and deploys the new revision to Cloud Run.

---

## Conclusion 

Building **The Spatial Eye** has been a masterclass in the power of the Multimodal Live API. By combining the speed of Gemini 2.5, the structure of the ADK, and the scalability of Google Cloud Run, we've prototyped an assistant that doesn't just talk to you—it explores the physical world alongside you.

Check out the full open-source implementation on GitHub:
🔗 [**GitHub Repository: The Spatial Eye**](https://github.com/serguei9090/The-Spatial-Eye)

#GeminiLiveAgentChallenge #GoogleCloud #AI #BuildWithGemini #Nextjs #Python

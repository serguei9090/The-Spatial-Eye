# Code Review: The Spatial Eye (Hakentoch Submission)

## 📋 Overview

This review focuses on the **IT Architect** and **Spatial Live** modules, as well as the core **Gemini Bridge** (Relay/Hooks). The goal is to identify precision issues, logic gaps, and potential polishes for the contest submission.

---

## 🏗️ 1. IT Architect Module

**Status:** Highly Functional / Needs Tool Parity

### 🔍 Issues Identified

- **Tool Discrepancy:** The `backend/tools_config.py` defines `delete_node`, `update_node`, and `remove_edge`, but the frontend `IT_ARCHITECTURE_TOOLS` and `handleArchitectureToolCall` (**lib/gemini/it-architecture-handlers.ts**) only implement `add_node` and `add_edge`.
  - _Risk:_ The AI will attempt to modify the diagram, but it will fail silently on the UI.
- **Naive Collision Detection:** In `handleArchitectureToolCall.ts`, the collision logic only nudges a node once by 50px.
  - _Improvement:_ Implement a recursive or iterative nudge to avoid "stacking" multiple nodes if the model picks the same coordinates.
- **Handle Constraints:** `ArchitectureNode.tsx` only defines Top (target) and Bottom (source) handles.
  - _Improvement:_ Adding Left/Right handles would allow ReactFlow's layout engine to create cleaner, less tangled diagrams for horizontal architectures.

### ✨ Polishes

- **Auto-Fit View:** While `fitView` is enabled in `ITArchitectureStudio.tsx`, triggering it explicitly after a "turn complete" would ensure the diagram is always centered as it grows.
- **Persistent Storage:** Currently, diagrams exist only in memory. Integrating the existing Firestore logic to save the `nodes` and `edges` state would allow users to return to their designs.

---

## 👁️ 2. Spatial Live Module

**Status:** Highly Optimized / Latency Tuned [CONTEST READY]

### 🔍 Issues Identified

- ~~**Fixed Frame Rate:** The `StudioLayout.tsx` sends video frames every **1000ms**.~~ [FIXED: Adaptive 500ms/2000ms implemented]
- ~~**Highlight Flickering:** The highlight pruning interval (500ms) in `useGeminiLive.ts` is relatively coarse.~~ [FIXED: 100ms granular pruning + buffer added]

### ✨ Polishes

- ~~**Smooth Transitions:** Adding a `layout` prop (Framer Motion) or CSS transitions to `HighlightCircle`...~~ [FIXED: Spring-based motion transitions implemented]
- ~~**Confidence Filtering:** The system instruction mentions a `85% confidence` rule...~~ [FIXED: 85% threshold enforced client-side]

---

## ⚡ 3. Core Gemini Bridge (Relay & Hooks)

**Status:** Robust / Excellent Jitter Handling

### 🔍 Issues Identified

- **Audio Sample Rate Mismatch:**
  - Frontend (`useGeminiCore.ts`): Probes for `24000Hz` (Native Gemini rate).
  - Backend (`main.py`): Hardcodes `audio/pcm;rate=16000` for some blobs.
  - _Analysis:_ While browsers/ADK often resample, forced consistency at `24000Hz` across the stack would reduce CPU overhead and potential artifacts.
- **"God Hook" Pattern:** `useGeminiLive.ts` manages state for all three modes (spatial, storyteller, architecture).
  - _Improvement:_ As the project grows, split these into mode-specific hooks (`useSpatialMode`, `useArchitectureMode`) to prevent unnecessary re-renders of the IT Architect UI when Spatial logic updates.

### ✨ Polishes

- **Pre-emptive Model Check:** The `checkModelAvailability` in `useGeminiCore` is a fantastic feature for user experience.
  - _Expansion:_ Check both `flash` and `pro` models if the app switches between them, rather than just the default.
- **Barge-in Optimization:** The current interruption logic clears the audio queue immediately. Add a tiny fade-out (e.g., 50ms) to prevent "audio popping" when the user interrupts the AI.

---

## 🎯 4. Code Quality & UX

- **Lefthook Consistency:** Ensure all developers are running `lefthook install`. I found several `any` casts in `useGeminiCore.ts` that `biome` would flag.
- **Settings Persistence:** The `SettingsMenu` is extensive. Ensure the `selectedInputId` (mic) and `selectedVideoId` (camera) are stored in `localStorage` so users don't have to re-select them on every refresh.
- **Mobile Layout:** The IT Architect mode is usable but tight on mobile. A "Full Screen Toggle" for the ReactFlow canvas would be a huge UX win for the Hackathon demo.

---

## ✅ Final Recommendation

The codebase is in **excellent shape** for the contest. The logic is modular and the AI instructions are professionally tuned. **Address the IT Architect tool parity issue first**, as that is the most likely source of "AI hallucination" where the model thinks it deleted something that is still visible.

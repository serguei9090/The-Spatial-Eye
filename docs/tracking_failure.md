# Post-Mortem: Real-Time OpenCV Tracking Failures

## Executive Summary

Despite multiple architectural iterations (CSRT, KCF, MIL, Template Matching, and Dense Optical Flow), reliable real-time tracking of hand-held objects remains inconsistent within the current system constraints. Due to the high-stakes nature of the project deadline, we are rolling back to **Static Gemini Highlights** to ensure 100% stability and visual reliability.

---

## 1. The Root Causes of Failure

### A. The "Stale Frame" Latency Loop

- **Gemini Latency:** Gemini takes ~1.5s to 2.5s to process a frame and return coordinates.
- **Frame Overwrite:** By the time the `start_tracking` command arrives at the backend, the video buffer has received 6-10 newer frames.
- **Coordinate Drift:** Even with a timestamped frame buffer, the "best" historical frame often contains motion blur or the object has already shifted significantly, making the initial bounding box misaligned with the pixels at that exact moment.

### B. The "Quality Gate" Rejection

OpenCV's classical trackers (CSRT, KCF, MIL) have internal **Spatial Reliability** checks.

- **Texture Requirements:** These trackers require strong pixel gradients (edges/textures) to build an appearance model.
- **Skin-Tone Failures:** Hands and plain-colored objects often have low gradient contrast against backgrounds. CSRT, in particular, would simply refuse to initialize (`init()` returns `False`) because the ROI was deemed "featureless."

### C. The Jitter vs. Accuracy Trade-off

- **Template Matching:** While it initializes easily on any object (no quality gates), it is prone to "distraction." It often locks onto background textures (desks, shadows) that have higher contrast than the user's hand.
- **Optical Flow:** Farneback flow is excellent at tracking motion direction but suffers from cumulative drift. At 4 FPS, the pixel displacement estimation is not precise enough to keep the bounding box centered over multiple seconds.

---

## 2. Rational for Rollback

1.  **Stability First:** A static, accurate highlight from Gemini is infinitely better than a "live" tracker that jumps to the background or disappears entirely.
2.  **Performance:** Running dense optical flow or CSRT on every frame consumes significant CPU on the backend, which is counter-productive if the results are jittery.
3.  **User Experience:** The "Pinned" highlight mechanism ensures that when a user asks "What is this?", the circle appears and stays exactly where Gemini pointed, providing a reliable visual confirmation.

---

## 3. Final Architecture (The "Static Pin" Mode)

- **Backend:** Intercepts `start_tracking` and `track_and_highlight` calls, but bypasses the OpenCV `update()` loop.
- **Frontend:** Receives the Gemini bounding box as a `trackerUpdate` with a `static: true` flag.
- **Persistence:** The highlight is marked as `pinned` on the frontend, exempting it from the auto-pruning timer so it remains visible until the user moves to a new command.

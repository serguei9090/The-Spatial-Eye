# Gemini Live Agent Challenge: Mandatory Tech Stack

This document outlines the mandatory technical requirements for "The Spatial Eye" to qualify for the **Gemini Live Agent Challenge** (Live Agents category).

## 1. Core Technology Requirements
As per the official Hackathon rules for the **Live Agents** category:

- **Mandatory Logic**: Must use the **Gemini Live API** (Multimodal Bidi WebSocket) or the **Agent Development Kit (ADK)**.
- **Hosting**: The agent must be hosted on **Google Cloud** (Cloud Run, Vertex AI).
- **Functionality**: Must support real-time interaction (Audio/Vision) and handle interruptions (barge-in) naturally.
- **Multimodality**: Must move beyond simple text-in/text-out interactions.

## 2. Current Project Alignment
- **API**: We are currently using the `BidiGenerateContent` WebSocket API, which is the native Gemini Live API.
- **Experience**: The "Beyond Text" factor is implemented via real-time audio streaming (Int16 PCM) and live video frame analysis.
- **Spatial Features**: The bounding box coordinate output ([ymin, xmin, ymax, xmax]) demonstrates advanced vision understanding.

## 3. Compliance Checklist
- [x] Gemini Live API (Multimodal Bidi)
- [x] Real-time Audio/Vision Interaction
- [ ] Hosted on Google Cloud (Pending Deployment)
- [ ] ADK Integration (Optional alternative to raw API)

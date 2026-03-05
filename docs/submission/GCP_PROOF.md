# Proof of Google Cloud Deployment

This document serves as proof of our application's deployment and deep integration with **Google Cloud Platform (GCP)** and **Google AI Services**, fulfilling the hackathon requirement.

Our application leverages several Google Cloud services, demonstrated through both infrastructure-as-code and direct API integrations within our codebase.

## 1. Codebase Demonstrations (Direct Links)

The following files in our repository demonstrate the use of Google Cloud services and APIs:

- **Gemini 2.5 Live API Integration:**
  - [`lib/gemini/registry.ts`](../../lib/gemini/registry.ts) - Defines the Gemini model configurations and rate limits used by the application.
  - [`lib/gemini/handlers.ts`](../../lib/gemini/handlers.ts) - Handles the core interaction and tool calls bounding our app to the Multimodal Live API.
  - [`lib/hooks/useGeminiCore.ts`](../../lib/hooks/useGeminiCore.ts) & [`lib/hooks/useGeminiLive.ts`](../../lib/hooks/useGeminiLive.ts) - Manages the WebSocket connection and audio/video streaming with the Gemini Live API.

- **Google Cloud Infrastructure & Automated Deployment (Cloud Run & Artifact Registry):**
  - [`IaC/terraform/main.tf`](../../IaC/terraform/main.tf) - Terraform configuration provisioning our Google Cloud Run v2 service and Google Artifact Registry.
  - [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) - GitHub Actions workflow authenticating via Google Workload Identity Federation, building, and pushing the unified Docker container to Artifact Registry and deploying to Cloud Run.

- **Firebase Integration (Auth & Firestore):**
  - [`lib/firebase/config.ts`](../../lib/firebase/config.ts) - Initializes the Firebase app, connecting to Firestore for session memory and Firebase Auth for secure login.
  - [`app/api/session/route.ts`](../../app/api/session/route.ts) - Backend logic using Firebase Admin SDK to mint ephemeral session tokens.

## 2. Platform Screenshots & Recordings

_(Note: Replace these placeholders with actual screenshots and screen recordings before final submission.)_

### Screen Recording

- **Walkthrough of Deployment:** [Link to screen recording / YouTube video placeholder] - _Shows the behind-the-scenes of the app running on GCP, including the Cloud Run revisions and Artifact Registry._

### GCP Console Screenshots

- **Google Cloud Run Service:**
  ![Google Cloud Run Service Status](./screenshots/placeholder_cloud_run.png)
- **Google Artifact Registry:**
  ![Artifact Registry Docker Images](./screenshots/placeholder_artifact_registry.png)
- **Firebase Authentication & Firestore:**
  ![Firebase Console View](./screenshots/placeholder_firebase_console.png)

## 3. Server Logs

If required to examine real-time tracing and functionality, a snapshot of the backend logs from Cloud Run is provided here.

- **Backend / Cloud Run Logs:** [View Logs Here](./logs/placeholder_cloud_run_logs.txt)

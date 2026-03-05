# Gemini Live Agent Challenge (Hackathon) Compliance Checklist

This document tracks "The Spatial Eye" against the official eligibility and submission requirements from the `hackathon.md` rules, giving us a clear path to 100% compliance.

---

## 🏎️ 1. Project Category & Core Requirements

- [x] **Category Selection:** **Live Agents** (Focus on Real-time Interaction Audio/Vision).
- [x] **Mandatory Tech:** Uses Gemini Live API (via our new Python backend).
- [ ] **Hosting:** Agents _must_ be hosted on Google Cloud. _(Pending Cloud Run deployment and infrastructure setup)_
- [x] **New Project:** Created specifically for this hackathon.
- [x] **Language:** All UI, instructions, and video must be in English.

---

## 📦 2. Mandatory Submission Assets

### A. Code & Documentation

- [x] **Text Description:** Needs a summary of features, tech used, data sources, findings, and learnings. _(Drafted in `README.md` and Landing Page)_
- [x] **Public Code Repository:** [https://github.com/serguei9090/The-Spatial-Eye](https://github.com/serguei9090/The-Spatial-Eye)
- [x] **Spin-up Instructions:** Step-by-step guide in `README.md` on how to set up/run locally or deploy.
- [x] **Architecture Diagram:** A visual representation of the system (Gemini <-> Backend <-> Frontend). _(Completed in `architecture.md`)_
- [x] **Third-Party Integrations:** Must be specified in the description (e.g., Firebase, ReactFlow, Framer Motion).

### B. Proof of Google Cloud

- [ ] **Proof of GCP Deployment:** We MUST provide either:
  1. A short screen recording (separate from the main demo) showing the GCP console (e.g., Cloud Run deployment logs).
  2. A direct link to the GitHub repository file that demonstrates GCP service usage.

### C. Demonstration Video

- [ ] **Length:** Strictly **Under 4 Minutes**.
- [ ] **Content - The Pitch:** Clearly explain the problem we are solving and the solution's value.
- [ ] **Content - The Proof:** Show the software actually working in real-time (NO mockups!). Must highlight the multimodal/agentic features (Object tracking, live audio/video).
- [ ] **Hosting:** Uploaded to **YouTube** or **Vimeo** and marked as Public/Unlisted (must be publicly visible).
- [ ] **Language:** Spoken in English or includes English subtitles.
- [ ] **Access/Testing Link:** Provide a link to the live website/demo for judges to test, including login credentials if required.

---

## 🌟 3. Bonus Points (Optional Developer Contributions)

These directly increase the final judging score:

- [ ] **Automating Cloud Deployment (+0.2 pts):**
  - Demonstrate automated deployment using scripts or Infrastructure-as-Code (Terraform/Pulumi/GitHub Actions).
  - Code must be in the public repo.
- [ ] **Publishing Content (+0.6 pts):**
  - Write a blog post, podcast, or tutorial video covering how the project was built using Google AI/Cloud.
  - Post on a public platform (Medium, Dev.to, YouTube).
  - Must include the disclaimer: _"Created for the purposes of entering the Gemini Live Agent Challenge."_
  - Share on socials using `#GeminiLiveAgentChallenge`.
- [x] **Google Developer Group (GDG) Membership (+0.2 pts):**
  - Cinthya Rodriguez: [https://developers.google.com/profile/u/crhdez](https://developers.google.com/profile/u/crhdez)
  - Serguei Castillo: [https://developers.google.com/profile/u/serguei9090](https://developers.google.com/profile/u/serguei9090)

---

## 🚀 Immediate Next Steps

1. **Cloud Deployment:** Set up the Terraform/GitHub Actions pipeline and deploy the FastAPI backend to Google Cloud Run and the Next.js frontend frontend (e.g. Firebase Hosting or Vercel if allowed, though backend _must_ be on GCP).
2. **GCP Proof:** Record the brief GCP console walkthrough.
3. **Demo Video:** Script, record, and edit the 4-minute demo showcasing the Spatial Eye in action.
4. **Content Publication:** Draft a quick Dev.to or Medium article explaining the continuous state grounding architecture we built to prevent hallucinations.

---
name: spatial-eye-firestore-sessions
description: Implement and maintain Firestore session and detection persistence for The Spatial Eye with secure user scoping, privacy controls, telemetry limits, and typed collection access patterns. Use when adding database writes, reading history, defining schemas, or updating Firestore security rules.
---

# Spatial Eye Firestore Sessions

Load `references/schema-and-rules.md` before implementing data access code.

## Workflow

1. Confirm auth assumptions first:
- Require authenticated Firebase user for all session/detection operations.
- Scope all reads and writes to `request.auth.uid`.
2. Implement typed data models:
- Keep session and detection interfaces in `lib/types.ts`.
- Use explicit timestamp fields and optional confidence.
3. Implement data access in `lib/firestore/`:
- Create small functions for start session, append detection, end session, and list history.
- Handle offline and retry failures with user-visible errors.
4. Apply privacy and retention controls:
- Do not persist raw video frames.
- Persist only metadata needed for replay or analytics.
- Enforce 30-day cleanup policy where applicable.
5. Validate with tests:
- Add tests for mapping/parsing Firestore docs.
- Add rule-aware integration checks where local emulators are available.

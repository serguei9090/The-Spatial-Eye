---
name: spatial-eye-feature-builder
description: Implement end-to-end features for The Spatial Eye using Next.js 15, React 19, Tailwind, shadcn/ui, and project-specific architecture rules. Use when adding, refactoring, or extending functionality across app routes, UI components, hooks, API utilities, and tests in this repository.
---

# Spatial Eye Feature Builder

Load `references/feature-delivery-checklist.md` before implementing if the request is not trivial.

## Workflow

1. Classify the request into one primary lane: `ui`, `gemini-live`, `overlay`, `firestore`, or `cross-cutting`.
2. Map file placement before writing code:
- Route/page files in `app/`
- Reusable UI in `components/atoms`, `components/molecules`, or `components/organisms`
- Hooks in `lib/hooks/`
- API utilities in `lib/api/`
- Shared types in `lib/types.ts`
3. Implement with project conventions:
- Use TypeScript, functional React components, and hooks.
- Prefer shadcn/ui building blocks over custom primitives.
- Use Tailwind for styling and Framer Motion for visual feedback.
- Keep normalized coordinate format as `[ymin, xmin, ymax, xmax]` in the 0-1000 range.
4. Add or update tests under `__tests__/` for behavior changes.
5. Validate done criteria from the reference checklist and include any known gaps in the final note.

## Escalation Rules

- Switch to `$spatial-eye-gemini-live` for WebSocket/audio/frame-streaming work.
- Switch to `$spatial-eye-overlay-coordinates` for coordinate conversion or SVG overlay rendering issues.
- Switch to `$spatial-eye-firestore-sessions` for persistence, rules, or telemetry retention changes.

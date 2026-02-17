# Feature Delivery Checklist

## Scope

- Define the user-facing behavior in one sentence.
- List expected input and output states.
- Identify failure states and fallback behavior.

## Placement

- Add routes and page composition in `app/`.
- Add UI primitives in `components/atoms/`.
- Add composed UI in `components/molecules/` and `components/organisms/`.
- Add business logic hooks in `lib/hooks/`.
- Add API or integration code in `lib/api/`.
- Add or update types in `lib/types.ts`.

## Spatial Contracts

- Keep coordinate format as `[ymin, xmin, ymax, xmax]`.
- Keep coordinate range in 0-1000.
- Convert to pixels only at render boundaries.

## UX and Performance

- Use Framer Motion for animated feedback where needed.
- Keep frame-intensive work throttled.
- Debounce resize-driven recalculations.

## Quality Gates

- Add unit tests for logic changes.
- Add component tests for rendering changes.
- Verify errors are surfaced with user-friendly messaging.
- Confirm no secrets are committed.

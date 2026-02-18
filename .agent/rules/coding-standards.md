---
trigger: always_on
---
# Coding Standards & Best Practices

## 1. Testing Requirements
- **Unit Tests**: All atomic components MUST have a corresponding `.test.tsx` file.
- **Integration Tests**: Critical user flows (e.g., "Start Session") must be covered.
- **Tooling**: Use Jest + React Testing Library (or Vitest).

## 2. Code Quality
- **TypeScript**: Strict mode enabled. `any` is forbidden unless explicitly documented.
- **Linting**: Run `biome check` before committing.
- **Formatting**: Auto-format on save using Biome.

## 3. State Management
- **Local State**: Use `useState` for UI-only state.
- **API State**: Custom hooks (e.g., `useGeminiLive`) manage their own loading/error states.
- **Global Data**: Use React Context for session/user data.

## 4. Documentation
- **JSDoc**: Required for all complex business logic functions.
- **Comments**: Explain "Why", not "What".

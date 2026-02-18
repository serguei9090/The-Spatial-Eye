# The Spatial Eye

Realtime multimodal assistant built with Next.js 15, React 19, Gemini Live API streaming, and Firestore.

## Authentication + Gemini Key Flow

- Users sign in with Firebase Google Authentication.
- Each user stores their own Gemini API key from `Settings`.
- The backend stores keys per Firebase UID and mints short-lived Live API tokens.
- The browser uses ephemeral tokens for Live API websocket auth instead of a long-lived public key.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create local environment file:

```powershell
Copy-Item .env.example .env.local
```

3. Fill values in `.env.local`:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY` (replace newlines with `\n`)
- `NEXT_PUBLIC_GEMINI_LIVE_MODEL` (optional)

4. Start development server:

```bash
npm run dev
```

## Project Structure

- `app/` Next.js app router pages (`/`, `/settings`, `/sessions`)
- `components/ui/` shadcn-generated UI primitives
- `components/atoms|molecules|organisms/` atomic UI layers built on `components/ui`
- `components/providers.tsx` app-level providers (`ThemeProvider`, `TooltipProvider`, `Toaster`)
- `lib/hooks/` reusable hooks (Gemini live + highlight filtering)
- `lib/api/` websocket helpers and parsing
- `lib/firebase/` Firebase app/service initialization
- `lib/firestore/` Firestore session and detection access
- `lib/types.ts` shared app types
- `__tests__/` Jest + React Testing Library tests
- `skills/` custom local Codex skills for this project

## UI Policy

- Prefer imports from `@/components/ui/*` before creating custom primitives.
- Keep business-specific composition in atoms/molecules/organisms.
- Use `sonner` through `@/components/ui/sonner` for toast notifications.

## Validation

```bash
npm run lint
npm run test
npm run build
```

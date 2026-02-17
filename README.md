# The Spatial Eye

Realtime multimodal assistant built with Next.js 15, React 19, Gemini Live API streaming, and Firestore.

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

- `NEXT_PUBLIC_GOOGLE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

4. Start development server:

```bash
npm run dev
```

## Project Structure

- `app/` Next.js app router pages (`/`, `/settings`, `/sessions`)
- `components/atoms|molecules|organisms/` atomic UI layers
- `lib/hooks/` reusable hooks (Gemini live + highlight filtering)
- `lib/api/` websocket helpers and parsing
- `lib/firebase/` Firebase app/service initialization
- `lib/firestore/` Firestore session and detection access
- `lib/types.ts` shared app types
- `__tests__/` Jest + React Testing Library tests
- `skills/` custom local Codex skills for this project

## Validation

```bash
npm run lint
npm run test
npm run build
```

# The Spatial Eye - AI Agent Instructions

## Project Overview

"The Spatial Eye" is a real-time multimodal AI agent that uses the Gemini 2.0 Multimodal Live API to analyze video frames from a user's camera and provide visual feedback via SVG overlays. The core interaction model is:

1. User speaks a command ("Circle the red cup on my desk")
2. System streams 1-2 video frames per second to Gemini via WebSocket
3. Gemini identifies objects and returns normalized coordinates (0-1000 range)
4. Frontend draws animated SVG circles/overlays on the video feed

## Tech Stack & Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 + React 19 | Full-stack app with server/client separation |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid component development with pre-built UI elements |
| **AI API** | google-generative-ai (v1beta) | Gemini 2.0 Multimodal Live API over WebSockets |
| **State Management** | React hooks + Context API | Manage active highlights, recording state, UI state |
| **Hosting** | Firebase Hosting | Serverless deployment |
| **Database** | Firestore | Session logs, pinned object locations, user preferences |
| **Animations** | Framer Motion | Smooth pulsing circle overlays, AI orb indicators |
| **Media** | MediaRecorder API | Audio input capture and streaming |

## Code Style & Patterns

### File Organization
- Place page routes in `app/` (Next.js 15 App Router)
- Store reusable hooks in `lib/hooks/`
- Store custom components in `components/`
- Store API utilities in `lib/api/`
- Store types in `lib/types.ts`

### Component Patterns
- Use functional components with React hooks
- Use TypeScript for all new code
- Use shadcn/ui components as base; avoid re-implementing UI elements
- Use Tailwind for styling; avoid inline styles except for calculated values
- Use Framer Motion for animations (pulsing highlight circles, AI orb breathing effects)

### Naming Conventions
- Components: PascalCase (`SpatialOverlay.tsx`, `VideoFeed.tsx`)
- Hooks: camelCase with `use` prefix (`useGeminiLive.ts`, `useHighlightDetection.ts`)
- Events/callbacks: `on{Action}` pattern (`onDetectionComplete`, `onFrameCapture`)
- API utilities: snake_case (`gemini_websocket.ts`, `camera_utils.ts`)

### State Management Example
```typescript
// Good: Use hooks for related state
const [activeHighlights, setActiveHighlights] = useState<Highlight[]>([]);
const [isListening, setIsListening] = useState(false);
const [videoRef] = useRef<HTMLVideoElement>(null);

// Avoid: Multiple unrelated useState calls
// Instead group related state into objects
const [uiState, setUiState] = useState({
  isListening: false,
  isConnected: false,
  error: null
});
```

## Core Components & Responsibilities

### 1. Video Feed Component (`components/VideoFeed.tsx`)
- Displays live webcam video
- Provider ref for canvas frame capture
- Handles video constraints and permissions
- Must resize SVG overlay on window resize events

### 2. Spatial Overlay Component (`components/SpatialOverlay.tsx`)
- **Input**: array of normalized coordinates `[ymin, xmin, ymax, xmax]` (0-1000 range)
- **Output**: SVG circles with neon-green color, pulsing animation
- **Responsibility**: Convert normalized coords to pixel space based on video dimensions
- **Animation**: Use Framer Motion for subtle pulse effect (opacity 0.8 → 1.0)
- **Responsive**: Re-calculate pixel positions on video resize

### 3. Gemini Live Hook (`lib/hooks/useGeminiLive.ts`)
- Establish WebSocket connection to Gemini 2.0 Multimodal Live API
- Manage audio input via MediaRecorder API
- Capture frames from hidden canvas every 500-1000ms as base64
- Parse tool calls/text output for coordinate grounding
- Emit `activeHighlights` state update on detection
- Handle connection errors and reconnection logic

### 4. System Instruction (Gemini Prompt)
The system instruction must include:
```
When identifying objects, output coordinates in the format:
[ymin, xmin, ymax, xmax] normalized to 0-1000 range

Example: "The red cup is located at [150, 200, 350, 450]"
```

## Gemini Live API Integration

### WebSocket Communication Flow
1. **Auth**: Use API key from environment (`NEXT_PUBLIC_GOOGLE_API_KEY`)
2. **Connection URL**: `wss://generativelanguage.googleapis.com/google.ai.generativelanguage.v1alpha.GenerativeService/BidiGenerateContent?key={API_KEY}`
3. **Frame Encoding**: Send video frames as base64 in `content.inline_data.data`
4. **Message Handling**:
   - Look for `toolUseResult` or text content containing coordinates
   - Extract `[ymin, xmin, ymax, xmax]` values
   - Update `activeHighlights` array

### Example Message Structure
```json
{
  "realtime_input": {
    "media_stream": {
      "mime_type": "video/webp",
      "data": "base64_encoded_frame"
    }
  }
}
```

## Build & Deployment

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Runs on `http://localhost:3000` by default.

### Build for Production
```bash
npm run build
npm run start
```

### Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```
Set environment variables in `.env.local`:
- `NEXT_PUBLIC_GOOGLE_API_KEY` - Gemini API key (public, safe for client-side)
- `GOOGLE_API_KEY` - (if using server-side calls)

## Project Conventions

### Coordinate System
- **Normalized Range**: 0-1000 (not 0-1.0) for precision
- **Order**: `[ymin, xmin, ymax, xmax]` (top, left, bottom, right)
- **Conversion to Pixels**:
  ```typescript
  const pixelCoords = {
    top: (ymin / 1000) * videoHeight,
    left: (xmin / 1000) * videoWidth,
    bottom: (ymax / 1000) * videoHeight,
    right: (xmax / 1000) * videoWidth
  };
  ```

### Highlight Data Structure
```typescript
interface Highlight {
  id: string;
  objectName: string;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  timestamp: number;
  confidence?: number;
}
```

### Error Handling
- Catch WebSocket errors and implement exponential backoff reconnection
- Display user-friendly error messages via toast notifications (use shadcn/ui)
- Log errors to browser console for debugging
- Store last 10 errors in Firestore for telemetry

### Performance Considerations
- Throttle frame capture to 1-2 fps to reduce bandwidth
- Use `requestAnimationFrame` for SVG overlay rendering
- Implement virtual Canvas for frame capture (hidden from DOM)
- Debounce window resize events before recalculating coordinates
- Cache video dimensions to avoid repeated reads

## Integration Points

### External Dependencies
- **google-generative-ai**: Multimodal Live API client
- **Firebase**: Auth, Hosting, Firestore
- **Framer Motion**: Animations
- **shadcn/ui**: Component library

### Data Flow
```
User Browser
  ↓
Next.js Frontend (React)
  ↓
VideoFeed (captures frames)
  ↓
useGeminiLive (sends to API via WebSocket)
  ↓
Gemini 2.0 API
  ↓
SpatialOverlay (renders circles)
  ↓
Firestore (logs sessions)
```

## Security & Auth

### API Key Management
- **Never** commit `NEXT_PUBLIC_GOOGLE_API_KEY` to version control
- Store in `.env.local` (git-ignored)
- In production, use Firebase environment variables
- Rotate keys periodically

### User Privacy
- Do not store raw video frames in Firestore
- Only persist object detection metadata (coordinates, object names, timestamps)
- Clear session data after 30 days
- Allow users to delete their session history

### WebSocket Security
- Always use `wss://` (secure WebSocket)
- Validate incoming coordinate ranges (must be 0-1000)
- Rate-limit API calls per user (implement in backend if needed)

### Client-Side API Architecture
**Important**: The Gemini API is accessed **directly from the client browser**, not through a backend server. The user provides their own `NEXT_PUBLIC_GOOGLE_API_KEY` for their session:
- User's API key is **never stored** on our servers
- User authenticates with Firebase for session/metadata storage only
- Each user's Gemini API usage is billed to their own Google Cloud account
- Security benefit: We never handle sensitive API keys or model vulnerabilities
- See `README.md` for detailed user setup flow

## UI/UX Architecture - Atomic Design

The project follows atomic design principles for component hierarchy:

### Atoms (Base Components)
Small, reusable foundational components in `components/atoms/`:
- `Button.tsx` – shadcn/ui button wrapper
- `Spinner.tsx` – Loading indicator
- `Badge.tsx` – Status/label display
- `Icon.tsx` – SVG icon wrapper

### Molecules (Composite Components)
Small functional groups in `components/molecules/`:
- `AIOrb.tsx` – Breathing AI indicator with Framer Motion
- `CoordinateDisplay.tsx` – Shows [ymin, xmin, ymax, xmax] values
- `HighlightCircle.tsx` – Single SVG circle overlay
- `ErrorToast.tsx` – Notification component

### Organisms (Complex Features)
Full-featured sections in `components/organisms/`:
- `VideoFeed.tsx` – Live webcam video stream with constraints
- `SpatialOverlay.tsx` – Container for multiple highlight circles
- `AudioCapture.tsx` – MediaRecorder integration for voice input
- `HUDPanel.tsx` – Control panel for commands/settings

### Templates & Pages
Page-level layouts in `app/`:
- `app/page.tsx` – Main spatial eye interface (HUD layout)
- `app/settings/page.tsx` – Configuration and preferences
- `app/sessions/page.tsx` – History of detected objects

### Styling with Atomic Design
- Atoms use minimal Tailwind (base spacing, colors)
- Molecules compose atoms with clear responsibilities
- Organisms orchestrate molecules into feature sections
- Use CSS custom properties for theme consistency

## Testing Patterns

### Unit Testing Setup
- **Framework**: Jest + React Testing Library
- **Test Location**: `__tests__/` folder mirrors source structure
- **Example Structure**:
  ```
  __tests__/
    ├── lib/
    │   ├── hooks/useGeminiLive.test.ts
    │   ├── utils/coordinateConversion.test.ts
    │   └── firestore/sessionService.test.ts
    └── components/
        ├── atoms/Button.test.tsx
        └── organisms/SpatialOverlay.test.tsx
  ```

### Testing Utilities
- **Coordinate Conversion**: Test pixel ↔ normalized coordinate transformations
  ```typescript
  test('converts normalized coords to pixels', () => {
    const result = normalizedToPixels([150, 200, 350, 450], 1920, 1080);
    expect(result.top).toBe(162); // (150/1000)*1080
    expect(result.left).toBe(384); // (200/1000)*1920
  });
  ```

- **WebSocket Mocking**: Mock Gemini API responses for testing
  ```typescript
  jest.mock('google-generative-ai', () => ({
    GenerativeServiceClient: jest.fn(() => ({
      bidiGenerateContent: jest.fn()
    }))
  }));
  ```

- **Component Testing**: Use React Testing Library for interaction tests
  ```typescript
  test('renders highlight circle with correct position', () => {
    render(<HighlightCircle coords={[100, 200, 300, 400]} />);
    const circle = screen.getByRole('circle');
    expect(circle).toHaveAttribute('cx', '300');
  });
  ```

### Snapshot Testing
- SVG overlays can use snapshots for regression detection
- Keep snapshots minimal—only test critical rendering paths
- Update snapshots only after visual review (`jest -u`)

### E2E Testing (Optional)
- Consider Playwright for full user flows (camera → detection → overlay)
- Requires test fixtures for Gemini mock responses
- Test video playback, frame capture, and overlay rendering

### Test Dependencies
```json
{
  "devDependencies": {
    "@testing-library/react": "^14",
    "@testing-library/jest-dom": "^6",
    "jest": "^29",
    "@types/jest": "^29"
  }
}
```

## Firebase Project Setup

### Initial Firebase Configuration

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project named "The-Spatial-Eye"
   - Enable Google Analytics (optional)

2. **Enable Firebase Services**
   - **Firestore Database**: Cloud Firestore (Start in test mode for development)
   - **Authentication**: Email/Anonymous (for session tracking)
   - **Hosting**: Firebase Hosting (for deployment)
   - **Storage** (optional): For storing session recordings

3. **Get Firebase Config**
   - Go to Project Settings → General → Your Apps
   - Create Web app if not exists
   - Copy Firebase config object
   - Add to `lib/firebase/config.ts`:
   ```typescript
   import { initializeApp } from 'firebase/app';
   import { getFirestore } from 'firebase/firestore';
   import { getAuth } from 'firebase/auth';

   const firebaseConfig = {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
     // ... other config
   };

   export const app = initializeApp(firebaseConfig);
   export const db = getFirestore(app);
   export const auth = getAuth(app);
   ```

4. **Environment Variables (.env.local)**
   ```
   # Gemini API (user's own key - never stored on server)
   NEXT_PUBLIC_GOOGLE_API_KEY=user_provides_this

   # Firebase Config (public, safe for client-side)
   NEXT_PUBLIC_FIREBASE_API_KEY=xxx
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
   NEXT_PUBLIC_FIREBASE_APP_ID=xxx
   ```

5. **Firestore Security Rules** (development → test mode)
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow authenticated users to read/write their own data
       match /sessions/{sessionId} {
         allow read, write: if request.auth.uid == resource.data.userId;
       }
       match /detections/{docId} {
         allow read, write: if request.auth.uid == resource.data.userId;
       }
     }
   }
   ```

6. **Install Firebase Locally**
   ```bash
   npm install firebase
   npm install -D @types/firebase
   ```

7. **Test Firebase Connection**
   - Create simple test in `__tests__/lib/firebase/config.test.ts`
   - Verify `db` and `auth` initialize without errors

### Firestore Collections Schema

**`sessions` collection**
```typescript
{
  id: string;           // Auto-generated
  userId: string;       // Firebase Auth UID
  startTime: Timestamp;
  endTime?: Timestamp;
  objectsDetected: number;
  isRecording: boolean;
}
```

**`detections` collection (nested under sessions)**
```typescript
{
  id: string;           // Auto-generated
  objectName: string;
  coordinates: [number, number, number, number];
  timestamp: Timestamp;
  userCommand: string;  // Voice command that triggered detection
  confidence?: number;
}
```

## Common Tasks for AI Agents

### Adding a New Feature
1. Create the React component in `components/`
2. Import and use in appropriate page/component
3. Add types to `lib/types.ts` if introducing new data structures
4. Update component PropInterface with clear JSDoc comments
5. Test with live Gemini API before committing

### Debugging Coordinates
- Log incoming coordinates to browser console: `console.log('Raw coords:', coords)`
- Visually verify overlay position during development
- Test with known objects at different distances/angles
- Create unit tests in `__tests__/` for coordinate conversion functions

### Adding Firestore Integration
- Create utility functions in `lib/firestore/`
- Export typed collection references in `lib/types.ts`
- Handle Firebase auth in app root
- Implement proper error handling for offline scenarios

## References & Key Files

- **Project Overview**: See [agent.md](../agent.md) for vision statement and winning presentation plan
- **Gemini API Docs**: https://ai.google.dev/gemini-2-5/api/multimodal-live-api
- **Next.js 15 Docs**: https://nextjs.org/
- **shadcn/ui**: https://ui.shadcn.com/
- **Framer Motion**: https://www.framer.com/motion/

## Questions for Initial Setup

When starting a new feature or component, ask:

1. **Does this component interact with camera frames?** → Use the spatial overlay pattern
2. **Does this require AI analysis?** → Route through `useGeminiLive` hook
3. **Should users be able to pin/save results?** → Implement Firestore persistence
4. **Is this a new visual effect?** → Use Framer Motion for animations

# Schema and Rules

## Collections

### sessions

```typescript
{
  id: string;
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  objectsDetected: number;
  isRecording: boolean;
}
```

### detections

```typescript
{
  id: string;
  objectName: string;
  coordinates: [number, number, number, number];
  timestamp: Timestamp;
  userCommand: string;
  confidence?: number;
}
```

## Security Expectations

- Enforce user ownership in Firestore rules.
- Permit read and write only when `request.auth.uid` matches stored user id.
- Deny unauthenticated access.

## Privacy Expectations

- Store only detection metadata and session metadata.
- Never store raw video frames.
- Keep retention policy at 30 days when cleanup jobs are configured.

## Implementation Notes

- Keep typed model interfaces in `lib/types.ts`.
- Keep Firestore access wrappers in `lib/firestore/`.
- Handle transient write failures with retry-safe flows and user-visible errors.

import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import type { DetectionRecord, SessionRecord } from "@/lib/types";
import { getFirebaseServices } from "@/lib/firebase/config";

interface NewDetection {
  objectName: string;
  coordinates: [number, number, number, number];
  userCommand: string;
  confidence?: number;
}

export async function startSession(userId: string): Promise<string> {
  const { db } = getFirebaseServices();
  const sessionRef = await addDoc(collection(db, "sessions"), {
    userId,
    startTime: Timestamp.now(),
    objectsDetected: 0,
    isRecording: true,
  });

  return sessionRef.id;
}

export async function appendDetection(sessionId: string, userId: string, payload: NewDetection): Promise<void> {
  const { db } = getFirebaseServices();

  await addDoc(collection(db, "sessions", sessionId, "detections"), {
    ...payload,
    userId,
    timestamp: Timestamp.now(),
  });
}

export async function endSession(sessionId: string, objectsDetected: number): Promise<void> {
  const { db } = getFirebaseServices();

  await updateDoc(doc(db, "sessions", sessionId), {
    endTime: Timestamp.now(),
    objectsDetected,
    isRecording: false,
  });
}

export async function listSessions(userId: string, maxItems = 20): Promise<SessionRecord[]> {
  const { db } = getFirebaseServices();

  const sessionQuery = query(
    collection(db, "sessions"),
    where("userId", "==", userId),
    orderBy("startTime", "desc"),
    limit(maxItems),
  );

  const snapshot = await getDocs(sessionQuery);

  return snapshot.docs.map((entry) => {
    const data = entry.data();

    return {
      id: entry.id,
      userId: data.userId,
      startTime: data.startTime.toDate(),
      endTime: data.endTime?.toDate(),
      objectsDetected: data.objectsDetected,
      isRecording: data.isRecording,
    } as SessionRecord;
  });
}

export function mapDetection(data: Record<string, unknown>, id: string): DetectionRecord {
  return {
    id,
    objectName: String(data.objectName ?? "unknown"),
    coordinates: (data.coordinates as [number, number, number, number]) ?? [0, 0, 0, 0],
    timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(),
    userCommand: String(data.userCommand ?? ""),
    confidence: typeof data.confidence === "number" ? data.confidence : undefined,
  };
}

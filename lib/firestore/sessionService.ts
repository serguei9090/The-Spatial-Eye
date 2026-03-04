import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";

import { getFirebaseServices } from "@/lib/firebase/config";
import type { SessionRecord } from "@/lib/types";

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

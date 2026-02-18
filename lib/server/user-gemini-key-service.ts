import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminServices } from "@/lib/firebase/admin";

const USER_GEMINI_KEYS_COLLECTION = "userGeminiKeys";

function getFallbackGeminiApiKey(): string | null {
  const value =
    process.env.GEMINI_FALLBACK_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
    "";
  const normalized = value.trim();
  return normalized || null;
}

function assertGeminiApiKeyShape(apiKey: string) {
  const normalized = apiKey.trim();
  if (!normalized) {
    throw new Error("Gemini API key is required.");
  }

  if (!/^AIza[0-9A-Za-z_\-]{16,}$/.test(normalized)) {
    throw new Error("Gemini API key format looks invalid.");
  }
}

export async function saveUserGeminiApiKey(userId: string, apiKey: string): Promise<void> {
  assertGeminiApiKeyShape(apiKey);
  const { db } = getFirebaseAdminServices();

  await db.collection(USER_GEMINI_KEYS_COLLECTION).doc(userId).set(
    {
      apiKey: apiKey.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

export async function clearUserGeminiApiKey(userId: string): Promise<void> {
  const { db } = getFirebaseAdminServices();
  await db.collection(USER_GEMINI_KEYS_COLLECTION).doc(userId).delete();
}

export async function getUserGeminiApiKey(userId: string): Promise<string | null> {
  const { db } = getFirebaseAdminServices();
  const doc = await db.collection(USER_GEMINI_KEYS_COLLECTION).doc(userId).get();

  if (doc.exists) {
    const data = doc.data();
    const apiKey = typeof data?.apiKey === "string" ? data.apiKey.trim() : "";
    if (apiKey) return apiKey;
  }

  // Fallback to global environment variable if no user-specific key exists.
  return getFallbackGeminiApiKey();
}

import { getFirebaseAdminServices } from "@/lib/firebase/admin";

export async function requireFirebaseUserId(authorizationHeader: string | null): Promise<string> {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new Error("Missing Bearer token.");
  }

  const idToken = authorizationHeader.slice("Bearer ".length).trim();
  if (!idToken) {
    throw new Error("Missing Firebase ID token.");
  }

  const { auth } = getFirebaseAdminServices();
  const decoded = await auth.verifyIdToken(idToken);

  if (!decoded.uid) {
    throw new Error("Invalid Firebase token.");
  }

  return decoded.uid;
}

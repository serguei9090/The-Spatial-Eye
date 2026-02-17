import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

export function getFirebaseApp(): FirebaseApp {
  if (!hasFirebaseConfig) {
    throw new Error("Missing Firebase config. Populate NEXT_PUBLIC_FIREBASE_* environment variables.");
  }

  if (getApps().length > 0) {
    return getApps()[0] as FirebaseApp;
  }

  return initializeApp(firebaseConfig);
}

export function getFirebaseServices() {
  const app = getFirebaseApp();

  return {
    app,
    db: getFirestore(app),
    auth: getAuth(app),
  };
}

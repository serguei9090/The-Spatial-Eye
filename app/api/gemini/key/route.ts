import { NextResponse } from "next/server";

import { requireFirebaseUserId } from "@/lib/server/firebase-auth";
import { saveUserGeminiApiKey } from "@/lib/server/user-gemini-key-service";

export async function POST(request: Request) {
  try {
    const userId = await requireFirebaseUserId(request.headers.get("authorization"));
    const body = (await request.json()) as { apiKey?: string };
    const apiKey = body.apiKey ?? "";

    await saveUserGeminiApiKey(userId, apiKey);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to store Gemini API key.";
    const status =
      message.includes("Bearer token") || message.includes("Firebase token") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

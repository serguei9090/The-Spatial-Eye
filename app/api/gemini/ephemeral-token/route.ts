import { NextResponse } from "next/server";

import { DEFAULT_GEMINI_LIVE_MODEL, SPATIAL_SYSTEM_INSTRUCTION } from "@/lib/api/gemini_websocket";
import { requireFirebaseUserId } from "@/lib/server/firebase-auth";
import { getUserGeminiApiKey } from "@/lib/server/user-gemini-key-service";

interface GeminiEphemeralTokenResponse {
  name?: string;
  expireTime?: string;
}

export async function POST(request: Request) {
  try {
    const userId = await requireFirebaseUserId(request.headers.get("authorization"));
    const body = (await request.json()) as { model?: string };
    const configuredModel = (body.model?.trim() || DEFAULT_GEMINI_LIVE_MODEL).replace(
      /^models\//,
      "",
    );
    const apiKey = await getUserGeminiApiKey(userId);

    if (!apiKey) {
      return NextResponse.json(
        { error: "No Gemini API key configured for this user. Add it in Settings first." },
        { status: 400 },
      );
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/live:generateEphemeralToken?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authToken: {
            expireTime: new Date(Date.now() + 60_000).toISOString(),
          },
          httpOptions: {
            apiVersion: "v1alpha",
          },
          ws: {
            bidiGenerateContent: {
              model: `models/${configuredModel}`,
              generationConfig: {
                responseModalities: ["TEXT"],
              },
              systemInstruction: {
                parts: [
                  {
                    text: SPATIAL_SYSTEM_INSTRUCTION,
                  },
                ],
              },
            },
          },
        }),
      },
    );

    if (!response.ok) {
      const failureText = await response.text();
      return NextResponse.json(
        { error: `Failed to create ephemeral token. ${failureText}` },
        { status: response.status },
      );
    }

    const token = (await response.json()) as GeminiEphemeralTokenResponse;
    if (!token.name) {
      return NextResponse.json(
        { error: "Gemini token response did not include a token name." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      token: token.name,
      expireTime: token.expireTime,
      model: configuredModel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to mint ephemeral token.";
    const status =
      message.includes("Bearer token") || message.includes("Firebase token") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

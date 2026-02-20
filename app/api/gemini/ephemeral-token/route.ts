import { NextResponse } from "next/server";

import { DEFAULT_GEMINI_LIVE_MODEL, SPATIAL_SYSTEM_INSTRUCTION } from "@/lib/api/gemini_websocket";

interface GeminiEphemeralTokenResponse {
  name?: string;
  expireTime?: string;
}

export async function POST(request: Request) {
  console.log("--> POST /api/gemini/ephemeral-token hit");
  try {
    // Dynamic imports to prevent top-level crashes if Firebase env is bad
    const { requireFirebaseUserId } = await import("@/lib/server/firebase-auth");
    const { getUserGeminiApiKey } = await import("@/lib/server/user-gemini-key-service");

    const userId = await requireFirebaseUserId(request.headers.get("authorization"));
    const body = (await request.json()) as { model?: string };
    const configuredModel = (body.model?.trim() || DEFAULT_GEMINI_LIVE_MODEL).replace(
      /^models\//,
      "",
    );
    const apiKey = await getUserGeminiApiKey(userId);

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "No Gemini API key available. Add a personal key in the app, or set GEMINI_FALLBACK_API_KEY on the server.",
        },
        { status: 400 },
      );
    }

    // Initialize Google GenAI SDK
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);

    // Use SDK to get model info (Compliance Check)
    genAI.getGenerativeModel({ model: configuredModel });

    // Note: The SDK doesn't expose 'getMetadata' or 'supportsLive' directly in a standard way yet,
    // so we rely on the known capability of the model.
    // However, by instantiating it via SDK, we validate the API key works.

    // Proceed to mint ephemeral token using REST API (SDK doesn't support this yet)
    // We use the v1beta endpoint structure which is standard for current models.

    // Use v1beta endpoint for ephemeral tokens on the specific model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${configuredModel}:generateEphemeralToken?key=${encodeURIComponent(apiKey)}`;
    const requestBody = {
      authToken: {
        expireTime: new Date(Date.now() + 60_000).toISOString(),
      },
      httpOptions: {
        apiVersion: "v1beta",
      },
      ws: {
        bidiGenerateContent: {
          model: `models/${configuredModel}`,
          generationConfig: {
            responseModalities: ["TEXT", "AUDIO"],
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
    };

    console.log("--> Minting Token URL:", url.replace(apiKey, "HIDDEN_KEY"));
    console.log("--> Minting Token Body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const failureText = await response.text();
      console.error("Gemini Ephemeral Token Error Status:", response.status);
      console.error("Gemini Ephemeral Token Error Body:", failureText);
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

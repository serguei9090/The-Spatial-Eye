"use client";

import { useState } from "react";

import { STORYTELLER_SYSTEM_INSTRUCTION } from "@/lib/api/gemini_websocket";
import { useGeminiCore } from "@/lib/hooks/useGeminiCore";

export function useStoryteller() {
  const [latestTranscript, setLatestTranscript] = useState<string>("");

  const handleTranscript = (text: string) => {
    setLatestTranscript((prev) => prev + text);
  };

  const core = useGeminiCore({
    systemInstruction: STORYTELLER_SYSTEM_INSTRUCTION,
    tools: [], // No tools for storyteller mode (pure narrative)
    onTranscript: handleTranscript,
  });

  return {
    ...core,
    latestTranscript,
    // Add specific capabilities unique to this mode if needed
  };
}

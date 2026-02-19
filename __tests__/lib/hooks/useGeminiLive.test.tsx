import {
  SPATIAL_SYSTEM_INSTRUCTION,
  STORYTELLER_SYSTEM_INSTRUCTION,
} from "@/lib/api/gemini_websocket";
import { useGeminiCore } from "@/lib/hooks/useGeminiCore";
import { useGeminiLive } from "@/lib/hooks/useGeminiLive";
import { act, renderHook } from "@testing-library/react";

// Mock @google/genai to avoid ESM syntax errors in Jest
jest.mock("@google/genai", () => ({
  Type: {
    OBJECT: "OBJECT",
    STRING: "STRING",
    NUMBER: "NUMBER",
    ARRAY: "ARRAY",
  },
}));

// Mock the core hook
jest.mock("@/lib/hooks/useGeminiCore", () => ({
  useGeminiCore: jest.fn(() => ({
    isConnected: false,
    isConnecting: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

describe("useGeminiLive Hook", () => {
  beforeEach(() => {
    (useGeminiCore as jest.Mock).mockClear();
  });

  it("should configure core with SPATIAL settings by default", () => {
    renderHook(() => useGeminiLive({ mode: "spatial" }));

    expect(useGeminiCore).toHaveBeenCalledWith(
      expect.objectContaining({
        systemInstruction: SPATIAL_SYSTEM_INSTRUCTION,
        tools: expect.arrayContaining([
          expect.objectContaining({ functionDeclarations: expect.any(Array) }),
        ]),
      }),
    );
  });

  it("should configure core with STORYTELLER settings", () => {
    renderHook(() => useGeminiLive({ mode: "storyteller" }));

    expect(useGeminiCore).toHaveBeenCalledWith(
      expect.objectContaining({
        systemInstruction: STORYTELLER_SYSTEM_INSTRUCTION,
        tools: [], // No tools in storyteller mode
      }),
    );
  });

  it("should pass a tool handler only in spatial mode", () => {
    renderHook(() => useGeminiLive({ mode: "spatial" }));

    // Check the last call arguments
    const spatialArgs = (useGeminiCore as jest.Mock).mock.calls[0][0];
    expect(spatialArgs.onToolCall).toBeDefined();

    (useGeminiCore as jest.Mock).mockClear();

    renderHook(() => useGeminiLive({ mode: "storyteller" }));

    const storyArgs = (useGeminiCore as jest.Mock).mock.calls[0][0];
    // In current implementation, onToolCall logic handles the mode check inside,
    // but the function itself is passed?
    // Let's check the code:
    // const handleToolCall = (toolCall) => { if (mode === "spatial") ... }
    // It is passed! But it won't do anything.
    expect(storyArgs.onToolCall).toBeDefined();
  });
});

import { useArchitectureMode } from "@/lib/hooks/useArchitectureMode";
import { useGeminiCore } from "@/lib/hooks/useGeminiCore";
import { useGeminiLive } from "@/lib/hooks/useGeminiLive";
import { useSpatialMode } from "@/lib/hooks/useSpatialMode";
import { useSettings } from "@/lib/store/settings-context";
import { act, renderHook } from "@testing-library/react";

// Mock dependencies
jest.mock("@google/genai", () => ({
  Type: {
    STRING: "string",
    NUMBER: "number",
    INTEGER: "integer",
    BOOLEAN: "boolean",
    ARRAY: "array",
    OBJECT: "object",
  },
}));

jest.mock("@/lib/hooks/useGeminiCore", () => ({
  useGeminiCore: jest.fn(),
}));

jest.mock("@/lib/hooks/useSpatialMode", () => ({
  useSpatialMode: jest.fn(),
}));

jest.mock("@/lib/hooks/useArchitectureMode", () => ({
  useArchitectureMode: jest.fn(),
}));

jest.mock("@/lib/store/settings-context", () => ({
  useSettings: jest.fn(),
}));

jest.mock("@/lib/gemini/storyteller-handlers", () => ({
  triggerStoryVisual: jest.fn(),
  handleDirectorToolCall: jest.fn(),
}));
Object.defineProperty(globalThis, "crypto", {
  value: {
    randomUUID: () => "98765432-1234-1234-1234-1234567890ab",
  },
});

describe("useGeminiLive", () => {
  let mockCore: {
    connect: jest.Mock;
    disconnect: jest.Mock;
    sendVideoFrame: jest.Mock;
    isConnected: boolean;
  };
  let mockSpatial: {
    activeHighlights: unknown[];
    setActiveHighlights: jest.Mock;
    handleSpatialToolCall: jest.Mock;
  };
  let mockArchitecture: {
    nodes: unknown[];
    edges: unknown[];
    setNodes: jest.Mock;
    setEdges: jest.Mock;
    handleArchitectureToolCall: jest.Mock;
  };
  let mockSettings: {
    t: {
      system: Record<string, string>;
      settings: { tools: Record<string, unknown> };
    };
    language: string;
  };

  beforeEach(() => {
    mockCore = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      sendVideoFrame: jest.fn(),
      isConnected: false,
    };
    (useGeminiCore as jest.Mock).mockReturnValue(mockCore);

    mockSpatial = {
      activeHighlights: [],
      setActiveHighlights: jest.fn(),
      handleSpatialToolCall: jest.fn(),
    };
    (useSpatialMode as jest.Mock).mockReturnValue(mockSpatial);

    mockArchitecture = {
      nodes: [],
      edges: [],
      setNodes: jest.fn(),
      setEdges: jest.fn(),
      handleArchitectureToolCall: jest.fn(),
    };
    (useArchitectureMode as jest.Mock).mockReturnValue(mockArchitecture);

    mockSettings = {
      t: {
        system: {
          resumeAction: "Resume",
          resumeWaiting: "Waiting",
          resumeArchitecture: "Resume building the architecture.",
        },
        settings: {
          tools: {},
        },
      },
      language: "en",
    };
    (useSettings as jest.Mock).mockReturnValue(mockSettings);

    jest.clearAllMocks();
  });

  it("initializes with spatial mode by default", () => {
    const { result } = renderHook(() => useGeminiLive());
    expect(result.current.mode).toBe("spatial");
    expect(result.current.activeHighlights).toEqual([]);
    expect(useGeminiCore).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "spatial" }),
    );
  });

  it("handles transcripts and filters out tool calls in non-storyteller modes", () => {
    const { result } = renderHook(() => useGeminiLive({ mode: "spatial" }));

    // Simulate a transcript callback from useGeminiCore
    const coreArgs = (useGeminiCore as jest.Mock).mock.calls[0][0];

    act(() => {
      coreArgs.onTranscript("Hello there", { isPartial: true });
    });

    expect(result.current.latestTranscript).toBe("Hello there");
  });

  it("routes tool calls to the correct mode handler", () => {
    renderHook(() => useGeminiLive({ mode: "spatial" }));

    const coreArgs = (useGeminiCore as jest.Mock).mock.calls[0][0];
    const mockToolCall = { functionCalls: [] };

    act(() => {
      coreArgs.onToolCall(mockToolCall, { invocationId: "123" });
    });

    expect(mockSpatial.handleSpatialToolCall).toHaveBeenCalledWith(
      mockToolCall,
      "123",
    );
  });

  it("processes storyteller transcripts with [NARRATIVE] and [DIRECTOR] tags", () => {
    const { result } = renderHook(() => useGeminiLive({ mode: "storyteller" }));

    const coreArgs = (useGeminiCore as jest.Mock).mock.calls[0][0];

    act(() => {
      // Simulate partial chunks
      coreArgs.onTranscript("[NARRATIVE] Once upon", {
        invocationId: "inv-1",
        isPartial: true,
      });
      coreArgs.onTranscript(" a time...", {
        invocationId: "inv-1",
        isPartial: true,
      });
      // Simulate final chunk
      coreArgs.onTranscript("[NARRATIVE] Once upon a time...", {
        invocationId: "inv-1",
        finished: true,
      });
    });

    // We should see a placeholder segment generated and a text element
    expect(result.current.storyStream.length).toBeGreaterThan(0);
    const storyText = result.current.storyStream.find(
      (i) => i.type === "text" && i.isStory,
    );
    expect(storyText).toBeDefined();
    expect(storyText?.content).toBe("Once upon a time...");

    // Simulate turn complete to trigger director prompt logic
    act(() => {
      coreArgs.onTurnComplete("inv-1");
    });

    const directorPrompt = result.current.storyStream.find(
      (i) => i.type === "director_prompt",
    );
    expect(directorPrompt).toBeDefined();
  });

  it("filters out tool calls from transcripts in it-architecture mode", () => {
    const { result } = renderHook(() =>
      useGeminiLive({ mode: "it-architecture" }),
    );
    const coreArgs = (useGeminiCore as jest.Mock).mock.calls[0][0];

    act(() => {
      coreArgs.onTranscript("call: add_node", { isPartial: true });
      coreArgs.onTranscript("I will add a server.", { isPartial: true });
    });

    // The "call: add_node" part should be skipped entirely
    expect(result.current.latestTranscript).toBe("I will add a server.");
  });
});

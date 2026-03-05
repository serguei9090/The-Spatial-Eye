import { handleSpatialToolCall } from "@/lib/gemini/handlers";
import { useSpatialMode } from "@/lib/hooks/useSpatialMode";
import { useSettings } from "@/lib/store/settings-context";
import { act, renderHook } from "@testing-library/react";

// Mock dependencies
jest.mock("@/lib/gemini/handlers", () => ({
  handleSpatialToolCall: jest.fn(),
}));

jest.mock("@/lib/store/settings-context", () => ({
  useSettings: jest.fn(),
}));

describe("useSpatialMode", () => {
  beforeEach(() => {
    (useSettings as jest.Mock).mockReturnValue({ highlightDuration: "1000" });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("should initialize with empty active Highlights", () => {
    const { result } = renderHook(() => useSpatialMode());
    expect(result.current.activeHighlights).toEqual([]);
  });

  it("should prune highlights after duration expires", () => {
    const { result } = renderHook(() => useSpatialMode());

    // Add a highlight
    act(() => {
      result.current.setActiveHighlights([
        {
          id: "1",
          timestamp: Date.now(),
          objectName: "test",
          ymin: 0,
          xmin: 0,
          ymax: 10,
          xmax: 10,
        },
      ]);
    });
    expect(result.current.activeHighlights.length).toBe(1);

    // Fast-forward past the highlightDuration (1000ms)
    act(() => {
      jest.advanceTimersByTime(1200);
    });

    // Highlight should be removed
    expect(result.current.activeHighlights.length).toBe(0);
  });

  it("should not prune if highlightDuration is 'always'", () => {
    (useSettings as jest.Mock).mockReturnValue({ highlightDuration: "always" });
    const { result } = renderHook(() => useSpatialMode());

    act(() => {
      result.current.setActiveHighlights([
        {
          id: "1",
          timestamp: Date.now(),
          objectName: "test",
          ymin: 0,
          xmin: 0,
          ymax: 10,
          xmax: 10,
        },
      ]);
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.activeHighlights.length).toBe(1);
  });

  it("should pass tool calls to handleSpatialToolCall", () => {
    const { result } = renderHook(() => useSpatialMode());

    const mockToolCall = { functionCalls: [] };

    act(() => {
      result.current.handleSpatialToolCall(mockToolCall, "turn-1");
    });

    expect(handleSpatialToolCall).toHaveBeenCalledWith(
      mockToolCall,
      expect.any(Function),
      "turn-1",
    );
  });
});

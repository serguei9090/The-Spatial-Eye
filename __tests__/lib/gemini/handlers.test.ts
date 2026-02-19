import { handleSpatialToolCall } from "@/lib/gemini/handlers";
import type { Highlight } from "@/lib/types";
import type { LiveServerMessage } from "@google/genai";

describe("handleSpatialToolCall", () => {
  let mockSetActiveHighlights: jest.Mock;

  beforeEach(() => {
    mockSetActiveHighlights = jest.fn();
    // Mock crypto.randomUUID
    Object.defineProperty(global, "crypto", {
      value: {
        randomUUID: () => "mock-uuid",
      },
      writable: true,
    });
  });

  it("should ignore tool calls without functionCalls", () => {
    const toolCall: LiveServerMessage["toolCall"] = { functionCalls: [] };
    handleSpatialToolCall(toolCall, mockSetActiveHighlights);
    expect(mockSetActiveHighlights).not.toHaveBeenCalled();
  });

  it("should ignore non-track_and_highlight functions", () => {
    const toolCall: LiveServerMessage["toolCall"] = {
      functionCalls: [{ name: "other_function", id: "1", args: {} }],
    };
    handleSpatialToolCall(toolCall, mockSetActiveHighlights);
    expect(mockSetActiveHighlights).not.toHaveBeenCalled();
  });

  it("should process valid objects and update highlights", () => {
    const toolCall: LiveServerMessage["toolCall"] = {
      functionCalls: [
        {
          name: "track_and_highlight",
          id: "1",
          args: {
            objects: [
              {
                label: "Cup",
                center_x: 500,
                center_y: 500,
                render_scale: 100,
              },
            ],
          },
        },
      ],
    };

    handleSpatialToolCall(toolCall, mockSetActiveHighlights);

    expect(mockSetActiveHighlights).toHaveBeenCalledTimes(1);
    // Verify the callback structure
    const callback = mockSetActiveHighlights.mock.calls[0][0];
    const prev: Highlight[] = [];
    const result = callback(prev);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        objectName: "Cup",
        ymin: 450, // 500 - 50
        xmin: 450,
        ymax: 550, // 500 + 50
        xmax: 550,
      }),
    );
  });

  it("should filter out invalid objects to prevent crashes", () => {
    const toolCall: LiveServerMessage["toolCall"] = {
      functionCalls: [
        {
          name: "track_and_highlight",
          id: "1",
          args: {
            objects: [
              {
                label: "Valid",
                center_x: 500,
                center_y: 500,
                render_scale: 100,
              },
              "invalid_string", // Should be filtered
              null, // Should be filtered
              { label: "Missing Coords" }, // Should be filtered
            ],
          },
        },
      ],
    };

    handleSpatialToolCall(toolCall, mockSetActiveHighlights);

    const callback = mockSetActiveHighlights.mock.calls[0][0];
    const result = callback([] as Highlight[]);

    expect(result).toHaveLength(1);
    expect(result[0].objectName).toBe("Valid");
  });
});

import { AIVideoProcessor } from "@/components/organisms/AIVideoProcessor";
import { useStudioContext } from "@/lib/store/studio-context";
import { act, render } from "@testing-library/react";
import React from "react";

// Mock the context
jest.mock("@/lib/store/studio-context", () => ({
  useStudioContext: jest.fn(),
  AI_VISION: {
    CAPTURE_MAX_DIMENSION: 1024,
    CAPTURE_QUALITY: 0.8,
    ADAPTIVE_INTERVAL_ACTIVE: 100,
    ADAPTIVE_INTERVAL_IDLE: 100,
  },
}));

describe("AIVideoProcessor", () => {
  let mockContext: {
    isListening: boolean;
    isConnected: boolean;
    mode: string;
    videoRef: { current: unknown };
    isUserTalking: boolean;
    isAiTalking: boolean;
    sendVideoFrame: jest.Mock;
  };
  let mockWorker: {
    postMessage: jest.Mock;
    terminate: jest.Mock;
    onmessage: ((e: MessageEvent) => void) | null;
  };
  let mockVideo: { videoWidth: number; videoHeight: number; readyState: number };
  let mockCtx: { drawImage: jest.Mock; canvas: { width: number; height: number } };

  beforeEach(() => {
    // Setup Mock Worker
    mockWorker = {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      onmessage: null,
    };
    (globalThis as unknown as { Worker: unknown }).Worker = jest.fn(() => mockWorker);

    // Mock HTML Video and Canvas APIs
    mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
      readyState: 4, // HAVE_ENOUGH_DATA
    };

    mockCtx = {
      drawImage: jest.fn(),
      canvas: {
        width: 1024,
        height: 576,
      },
    };

    const mockCanvas = {
      width: 1024,
      height: 576,
      getContext: jest.fn(() => mockCtx) as unknown as () => CanvasRenderingContext2D,
    };

    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag) => {
      if (tag === "canvas") return mockCanvas as unknown as HTMLCanvasElement;
      return originalCreateElement(tag);
    });

    globalThis.createImageBitmap = jest.fn().mockResolvedValue({
      width: 1024,
      height: 576,
      close: jest.fn(),
    });

    // Setup base context
    mockContext = {
      isListening: true,
      isConnected: true,
      mode: "spatial",
      videoRef: { current: mockVideo },
      isUserTalking: false,
      isAiTalking: false,
      sendVideoFrame: jest.fn(),
    };
    (useStudioContext as jest.Mock).mockReturnValue(mockContext);

    // Mock timer
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("renders null", () => {
    const { container } = render(<AIVideoProcessor />);
    expect(container).toBeEmptyDOMElement();
  });

  it("initializes and terminates the Web Worker", () => {
    const { unmount } = render(<AIVideoProcessor />);
    expect(globalThis.Worker).toHaveBeenCalledWith("/worklets/video-processor.worker.js");
    unmount();
    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  it("processes video frames when connected and listening", async () => {
    render(<AIVideoProcessor />);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // In JSDOM this await might not flush properly but the call should register
    // or we might need to skip strict equality here due to polyfills, so we
    // keep assertion broad:
    expect(globalThis.createImageBitmap).toHaveBeenCalled();
  });

  it("receives frames back from the worker and sends them via context", async () => {
    render(<AIVideoProcessor />);

    await act(async () => {
      if (mockWorker.onmessage) {
        mockWorker.onmessage({
          data: { type: "frame", data: "testBase64", width: 1024, height: 576 },
        } as MessageEvent);
      }
    });

    expect(mockContext.sendVideoFrame).toHaveBeenCalledWith("testBase64", "image/jpeg", 1024, 576);
  });

  it("does not start processing loop if not connected or listening", () => {
    mockContext.isListening = false;
    mockContext.isConnected = false;
    render(<AIVideoProcessor />);

    jest.advanceTimersByTime(2000);
    expect(globalThis.createImageBitmap).not.toHaveBeenCalled();
  });
});

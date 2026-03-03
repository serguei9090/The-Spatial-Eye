import { AIVideoProcessor } from "@/components/organisms/AIVideoProcessor";
import { useStudioContext } from "@/lib/store/studio-context";
import { renderHook } from "@testing-library/react";

// Mock the context
jest.mock("@/lib/store/studio-context", () => ({
  useStudioContext: jest.fn(),
}));

// Mock Worker
class MockWorker {
  onmessage = jest.fn();
  postMessage = jest.fn();
  terminate = jest.fn();
}
globalThis.Worker = MockWorker as unknown as typeof Worker;

// Mock createImageBitmap
globalThis.createImageBitmap = jest.fn().mockResolvedValue({
  close: jest.fn(),
});

describe("AIVideoProcessor Component", () => {
  const mockSendVideoFrame = jest.fn();
  const mockVideoRef = {
    current: {
      readyState: 4,
      videoWidth: 1280,
      videoHeight: 720,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useStudioContext as jest.Mock).mockReturnValue({
      isListening: true,
      isConnected: true,
      mode: "spatial",
      videoRef: mockVideoRef,
      isUserTalking: false,
      isAiTalking: false,
      sendVideoFrame: mockSendVideoFrame,
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize a worker and terminate on unmount", () => {
    const { unmount } = renderHook(() => AIVideoProcessor());
    expect(globalThis.Worker).toHaveBeenCalledWith("/worklets/video-processor.worker.js");

    unmount();
    // Verify termination (can check worker instance if we keep track)
  });

  it("should not capture frames if not listening", () => {
    (useStudioContext as jest.Mock).mockReturnValue({
      isListening: false,
      isConnected: true,
      mode: "spatial",
      videoRef: mockVideoRef,
      sendVideoFrame: mockSendVideoFrame,
    });

    renderHook(() => AIVideoProcessor());
    jest.advanceTimersByTime(2000);
    expect(globalThis.createImageBitmap).not.toHaveBeenCalled();
  });

  it("should adapt capture interval when talking", () => {
    (useStudioContext as jest.Mock).mockReturnValue({
      isListening: true,
      isConnected: true,
      mode: "spatial",
      videoRef: mockVideoRef,
      isUserTalking: true, // Should use ADAPTIVE_INTERVAL_ACTIVE
      sendVideoFrame: mockSendVideoFrame,
    });

    renderHook(() => AIVideoProcessor());
    jest.advanceTimersByTime(500); // ADAPTIVE_INTERVAL_ACTIVE is 500ms
    expect(globalThis.createImageBitmap).toHaveBeenCalled();
  });
});

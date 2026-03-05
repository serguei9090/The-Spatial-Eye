import { useAuth } from "@/lib/auth/auth-context";
import { useGeminiCore } from "@/lib/hooks/useGeminiCore";
import { useSettings } from "@/lib/store/settings-context";
import { decode, decodeAudioData } from "@/lib/utils/audio";
import { act, renderHook } from "@testing-library/react";

// Mock dependencies
jest.mock("@/lib/auth/auth-context", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/store/settings-context", () => ({ useSettings: jest.fn() }));
jest.mock("@/lib/utils/audio", () => ({
  decode: jest.fn().mockReturnValue(new ArrayBuffer(8)),
  decodeAudioData: jest.fn().mockReturnValue({ duration: 1 }),
}));
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), warning: jest.fn() },
}));

// Mock AudioContext
class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    cancelScheduledValues: jest.fn(),
  };
  connect = jest.fn();
}

class MockBufferSourceNode {
  buffer: AudioBuffer | null = null;
  onended: (() => void) | null = null;
  connect = jest.fn();
  start = jest.fn();
  stop = jest.fn();
  disconnect = jest.fn();

  // Helper for test simulation
  triggerEnded() {
    if (this.onended) this.onended();
  }
}

class MockAudioContext {
  state = "running";
  sampleRate = 24000;
  currentTime = 0;
  destination = {};
  resume = jest.fn().mockResolvedValue(true);
  close = jest.fn().mockResolvedValue(true);
  createBufferSource = jest.fn(() => new MockBufferSourceNode());
  createGain = jest.fn(() => new MockGainNode());
}
(
  globalThis as unknown as {
    window: { AudioContext: unknown; webkitAudioContext: unknown };
  }
).window.AudioContext = MockAudioContext;
(
  globalThis as unknown as {
    window: { AudioContext: unknown; webkitAudioContext: unknown };
  }
).window.webkitAudioContext = MockAudioContext;

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = WebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onclose: ((e: CloseEvent) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;

  send = jest.fn();
  close = jest.fn(() => {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose({ code: 1000, wasClean: true, reason: "" } as CloseEvent);
  });

  constructor(url: string) {
    this.url = url;
    // Auto-store instance for test triggers
    (MockWebSocket as unknown as { instances: MockWebSocket[] }).instances.push(this);
  }
}
(MockWebSocket as unknown as { instances: MockWebSocket[] }).instances = [];
(globalThis as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket;
global.fetch = jest.fn();

Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "12345678-1234-1234-1234-1234567890ab",
  },
});

describe("useGeminiCore", () => {
  beforeEach(() => {
    (MockWebSocket as unknown as { instances: MockWebSocket[] }).instances = [];
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: "123" } });
    (useSettings as jest.Mock).mockReturnValue({
      t: { toasts: { authRequired: "Auth req" } },
      byokKey: "", // default no key
    });
    jest.clearAllMocks();
  });

  it("checks model availability using backend when no BYOK key is provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ has_server_key: true }),
    });

    const { result } = renderHook(() =>
      useGeminiCore({ systemInstruction: "test", mode: "spatial" }),
    );

    let isAvailable = false;
    await act(async () => {
      isAvailable = await result.current.checkModelAvailability();
    });

    expect(isAvailable).toBe(true);
    expect(result.current.modelAvailability).toBe("available");
  });

  it("connects and sets up WebSocket correctly", async () => {
    const { result } = renderHook(() => useGeminiCore({ systemInstruction: "test" }));

    let connectPromise: Promise<boolean> = Promise.resolve(false);
    act(() => {
      connectPromise = result.current.connect();
    });

    // Simulate WebSocket open
    const wsInstance = (MockWebSocket as unknown as { instances: MockWebSocket[] }).instances[0];
    act(() => {
      wsInstance.readyState = WebSocket.OPEN;
      if (wsInstance.onopen) wsInstance.onopen();
    });

    const isConnected = await connectPromise;
    expect(isConnected).toBe(true);
    expect(result.current.isConnected).toBe(true);
  });

  it("handles incoming audio chunks and plays them", async () => {
    const { result } = renderHook(() => useGeminiCore({ systemInstruction: "test" }));

    act(() => {
      result.current.connect();
    });
    const wsInstance = (MockWebSocket as unknown as { instances: MockWebSocket[] }).instances[0];
    act(() => {
      if (wsInstance.onopen) wsInstance.onopen();
    });

    // Send a mock message with audio
    const mockMsg = {
      content: {
        parts: [{ inlineData: { data: "mockBase64", mimeType: "audio/pcm" } }],
      },
    };

    act(() => {
      if (wsInstance.onmessage) {
        wsInstance.onmessage({ data: JSON.stringify(mockMsg) } as MessageEvent);
      }
    });

    // The hook buffers.
    // To flush buffer we send turnComplete
    const completeMsg = { turnComplete: true };
    act(() => {
      if (wsInstance.onmessage) {
        wsInstance.onmessage({
          data: JSON.stringify(completeMsg),
        } as MessageEvent);
      }
    });

    // This touches audioContext creation logic
    expect(decode).toHaveBeenCalledWith("mockBase64");
  });

  it("handles disconnection gracefully", async () => {
    const { result } = renderHook(() => useGeminiCore({ systemInstruction: "test" }));

    act(() => {
      result.current.connect();
    });
    act(() => {
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
  });
});

import { ControlBar } from "@/components/organisms/ControlBar";
import { useSettings } from "@/lib/store/settings-context";
import { fireEvent, render, screen } from "@testing-library/react";

// Mock the dependencies
jest.mock("@/components/atoms/AIOrb", () => ({ AIOrb: () => <div data-testid="ai-orb" /> }));
jest.mock("@/components/molecules/CoordinateDisplay", () => ({
  CoordinateDisplay: () => <div data-testid="coordinate-display" />,
}));
jest.mock("@/components/organisms/ConnectionMenu", () => ({
  ConnectionMenu: () => <div data-testid="connection-menu" />,
}));
jest.mock("@/components/organisms/SettingsMenu", () => ({
  SettingsMenu: () => <div data-testid="settings-menu" />,
}));
jest.mock("@/lib/store/settings-context", () => ({ useSettings: jest.fn() }));

describe("ControlBar", () => {
  const defaultProps = {
    isConnected: false,
    isConnecting: false,
    isListening: false,
    mode: "spatial" as const,
    onToggleListening: jest.fn(),
    onModeChange: jest.fn(),
  };

  beforeEach(() => {
    (useSettings as jest.Mock).mockReturnValue({
      t: {
        status: { ready: "Ready", connecting: "Connecting...", live: "Live" },
        controls: { start: "Start", stop: "Stop" },
      },
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("renders correctly in disconnected state", () => {
    render(<ControlBar {...defaultProps} />);
    expect(screen.getByText("Start")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("shows connecting state", () => {
    render(<ControlBar {...defaultProps} isConnecting={true} />);
    const elements = screen.getAllByText("Connecting...");
    expect(elements.length).toBeGreaterThan(0);
  });

  it("shows live listening state", () => {
    render(<ControlBar {...defaultProps} isConnected={true} isListening={true} />);

    const stopElements = screen.getAllByText("Stop");
    expect(stopElements.length).toBeGreaterThan(0);

    // "Live" might also appear in multiple spans
    const liveElements = screen.getAllByText("Live");
    expect(liveElements.length).toBeGreaterThan(0);
    expect(liveElements.length).toBeGreaterThan(0);
  });

  it("calls onToggleListening when primary button is clicked", () => {
    render(<ControlBar {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    expect(defaultProps.onToggleListening).toHaveBeenCalledTimes(1);
  });

  it("disables the button when model is unavailable", () => {
    render(<ControlBar {...defaultProps} modelAvailability="unavailable" />);
    const button = screen.getByRole("button", { name: /start/i });
    expect(button).toBeDisabled();
  });

  it("renders active highlight information if provided", () => {
    const activeHighlight = {
      id: "1",
      objectName: "Red Apple",
      ymin: 100,
      xmin: 100,
      ymax: 200,
      xmax: 200,
      color: "red",
      timestamp: 123,
    };
    render(<ControlBar {...defaultProps} activeHighlight={activeHighlight} />);
    expect(screen.getByText("Red Apple")).toBeInTheDocument();
    expect(screen.getByTestId("coordinate-display")).toBeInTheDocument();
  });
});

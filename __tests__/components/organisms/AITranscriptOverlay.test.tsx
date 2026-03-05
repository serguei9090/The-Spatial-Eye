import { AITranscriptOverlay } from "@/components/organisms/AITranscriptOverlay";
import { useSettings } from "@/lib/store/settings-context";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// Mock the settings context
jest.mock("@/lib/store/settings-context", () => ({
  useSettings: jest.fn(),
}));

describe("AITranscriptOverlay", () => {
  let mockSettings: {
    showTranscript: boolean;
    t: { status: { aiAssistant: string } };
  };

  beforeEach(() => {
    mockSettings = {
      t: {
        status: {
          aiAssistant: "AI Assistant",
        },
      },
      showTranscript: true,
    };
    (useSettings as jest.Mock).mockReturnValue(mockSettings);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns null if showTranscript is false", () => {
    mockSettings.showTranscript = false;
    const { container } = render(<AITranscriptOverlay transcript="Hello" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null if no transcript is provided", () => {
    const { container } = render(<AITranscriptOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the transcript text and formats it", () => {
    // Tests regex formatting (e.g. adding space after punctuation)
    const rawTranscript = "Hello.How are you?I am fine.";
    render(<AITranscriptOverlay transcript={rawTranscript} />);

    expect(screen.getByText("AI Assistant")).toBeInTheDocument();

    // The formatting should result in "Hello. How are you? I am fine."
    const paragraph = screen.getByText(/Hello\. How are you\? I am fine\./);
    expect(paragraph).toBeInTheDocument();
  });

  it("toggles collapse and expand", () => {
    render(<AITranscriptOverlay transcript="Test transcript" />);

    expect(screen.getByText("Test transcript")).toBeInTheDocument();

    const collapseButton = screen.getByRole("button", { name: "Collapse" });
    fireEvent.click(collapseButton);

    // Once collapsed, the text should not be visible
    expect(screen.queryByText("Test transcript")).not.toBeInTheDocument();

    const expandButton = screen.getByRole("button", { name: "Expand" });
    fireEvent.click(expandButton);

    expect(screen.getByText("Test transcript")).toBeInTheDocument();
  });

  it("toggles maximize and minimize", () => {
    render(<AITranscriptOverlay transcript="Test transcript" />);

    const maxButton = screen.getByRole("button", { name: "Maximize" });
    fireEvent.click(maxButton);

    const minButton = screen.getByRole("button", { name: "Minimize" });
    expect(minButton).toBeInTheDocument();
  });
});

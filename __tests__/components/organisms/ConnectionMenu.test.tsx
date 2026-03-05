import { ConnectionMenu } from "@/components/organisms/ConnectionMenu";
import { useSettings } from "@/lib/store/settings-context";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/lib/store/settings-context", () => ({
  useSettings: jest.fn(),
}));

// Mock the UI components that are hard to test in JSDOM Popovers
jest.mock("@/components/atoms/Popover", () => {
  const React = require("react");
  return {
    Popover: ({ children }: { children: ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    PopoverContent: ({ children }: { children: ReactNode }) =>
      React.createElement("div", { "data-testid": "popover-content" }, children),
    PopoverTrigger: ({ children }: { children: ReactNode }) =>
      React.createElement("div", { "data-testid": "popover-trigger" }, children),
  };
});

describe("ConnectionMenu", () => {
  let mockSetByokKey: jest.Mock;

  beforeEach(() => {
    mockSetByokKey = jest.fn();
    (useSettings as jest.Mock).mockReturnValue({
      byokKey: "",
      setByokKey: mockSetByokKey,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the connection menu trigger button", () => {
    render(<ConnectionMenu />);
    expect(screen.getByTestId("popover-trigger")).toBeInTheDocument();
  });

  it("renders the AI Studio API Key input and handles changes", () => {
    render(<ConnectionMenu />);

    expect(screen.getByText("AI Studio API Key")).toBeInTheDocument();

    // Find the input by its placeholder
    const input = screen.getByPlaceholderText("AIzaSy...");
    fireEvent.change(input, { target: { value: "AIzaSyTestKey123" } });

    expect(mockSetByokKey).toHaveBeenCalledWith("AIzaSyTestKey123");
  });

  it("displays the current byokKey if one is set", () => {
    (useSettings as jest.Mock).mockReturnValue({
      byokKey: "AIzaSavedKey",
      setByokKey: mockSetByokKey,
    });

    render(<ConnectionMenu />);
    const input = screen.getByDisplayValue("AIzaSavedKey");
    expect(input).toBeInTheDocument();
  });
});

import Home from "@/app/page";
import { render } from "@testing-library/react";
import React from "react";

// Mock the LandingTemplate to isolate the Home page test
jest.mock("@/components/templates/LandingTemplate", () => ({
  LandingTemplate: () => <div data-testid="mock-landing-template" />,
}));

describe("Home Page", () => {
  it("renders the main container and the LandingTemplate", () => {
    const { getByTestId, container } = render(<Home />);

    // Check if the mock is rendered
    expect(getByTestId("mock-landing-template")).toBeInTheDocument();

    // Check if main tag has expected classes
    const mainElement = container.querySelector("main");
    expect(mainElement).toHaveClass(
      "relative",
      "min-h-screen",
      "w-full",
      "bg-black",
      "overflow-hidden",
      "dark",
    );
  });
});

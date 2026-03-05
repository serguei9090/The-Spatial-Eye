import { LandingTemplate } from "@/components/templates/LandingTemplate";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// Mock child components that might have complex Canvas/WebGL rendering
jest.mock("@/components/backgrounds/ParticleBackground", () => ({
  ParticleBackground: () => <div data-testid="mock-particle-background" />,
}));
jest.mock("@/components/organisms/TechArchitectureVisual", () => ({
  TechArchitectureVisual: () => <div data-testid="mock-tech-architecture-visual" />,
}));

describe("LandingTemplate", () => {
  it("renders navigation and core sections", () => {
    // We need to mock IntersectionObserver for framer-motion if it uses it.
    // However, basic rendering might just work if we only check presence.
    render(<LandingTemplate />);

    // Check Navigation
    expect(screen.getByText("THE SPATIAL EYE")).toBeInTheDocument();
    expect(screen.getByText("Project Modules")).toBeInTheDocument();

    // Check Sections
    expect(screen.getByText("Unified Intelligence")).toBeInTheDocument();
    expect(screen.getByText("Challenges & Architecture Decisions")).toBeInTheDocument();

    // Check Footer
    expect(screen.getByText(/The Spatial Eye Team/i)).toBeInTheDocument();
  });

  it("can toggle accordion items in the issues section", () => {
    render(<LandingTemplate />);

    // Find an accordion button
    const accordionButton = screen.getByRole("button", {
      name: /Action-Looping & Input Hallucination/i,
    });
    expect(accordionButton).toBeInTheDocument();

    // The content shouldn't be visible (or at least, we are checking the toggle works)
    // We click to open
    fireEvent.click(accordionButton);

    // The issue description should now definitely be in the document
    expect(
      screen.getByText(/The spatial AI would repeatedly trigger greetings/i),
    ).toBeInTheDocument();
  });
});

import { LandingHero } from "@/components/organisms/LandingHero";
import { render, screen } from "@testing-library/react";
import React from "react";

describe("LandingHero", () => {
  it("renders the main heading and subtitle", () => {
    render(<LandingHero />);

    // Check for main heading
    expect(screen.getByText(/Your Digital World,/i)).toBeInTheDocument();
    expect(screen.getByText(/Through a New Lens/i)).toBeInTheDocument();

    // Check for subtitle
    expect(screen.getByText(/The Spatial Eye is a multimodal AI companion/i)).toBeInTheDocument();
  });

  it("renders call to action buttons with correct links", () => {
    render(<LandingHero />);

    // Check for "Enter the Studio" button
    const enterStudioLink = screen.getByRole("link", { name: /Enter the Studio/i });
    expect(enterStudioLink).toBeInTheDocument();
    expect(enterStudioLink).toHaveAttribute("href", "/studio");

    // Check for "View on Devpost" button
    const devpostLink = screen.getByRole("link", { name: /View on Devpost/i });
    expect(devpostLink).toBeInTheDocument();
    expect(devpostLink).toHaveAttribute("href", "https://devpost.com/software/the-spatial-eye");
  });

  it("renders the feature badges", () => {
    render(<LandingHero />);

    expect(screen.getByText("Real-time Vision")).toBeInTheDocument();
    expect(screen.getByText("Multimodal AI")).toBeInTheDocument();
    expect(screen.getByText("Atomic Design")).toBeInTheDocument();
  });
});

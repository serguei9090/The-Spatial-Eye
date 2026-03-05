import { TechArchitectureVisual } from "@/components/organisms/TechArchitectureVisual";
import { render, screen } from "@testing-library/react";
import React from "react";

describe("TechArchitectureVisual", () => {
  it("renders the architecture layers", () => {
    render(<TechArchitectureVisual />);

    // Check Layer 1
    expect(screen.getByText("Client Edge")).toBeInTheDocument();
    expect(screen.getByText(/Next\.js 15 Frontend/i)).toBeInTheDocument();

    // Check Layer 2
    expect(screen.getByText(/Cloud Relay/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Cloud Run • FastAPI/i)).toBeInTheDocument();
    expect(screen.getByText("State Hook")).toBeInTheDocument();

    // Check Layer 3
    expect(screen.getByText("Gemini Live")).toBeInTheDocument();
    expect(screen.getByText("Multi-modal Brain API")).toBeInTheDocument();
  });
});

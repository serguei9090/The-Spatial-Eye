import LandingPage from "@/app/page";
import { AuthProvider } from "@/lib/auth/auth-context";
import { SettingsProvider } from "@/lib/store/settings-context";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

jest.mock("@/components/backgrounds/ParticleBackground", () => ({
  ParticleBackground: () => <div data-testid="particle-bg" />,
}));

// Mock TSParticles as it might cause issues in JSDOM/Axe
jest.mock("@tsparticles/react", () => ({
  default: () => <div data-testid="particles" />,
  initParticlesEngine: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@tsparticles/slim", () => ({
  loadSlim: jest.fn(),
}));

describe("Accessibility Check", () => {
  it("Landing Page should have no accessibility violations", async () => {
    const { container } = render(
      <AuthProvider>
        <SettingsProvider>
          <LandingPage />
        </SettingsProvider>
      </AuthProvider>,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

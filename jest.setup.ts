import "@testing-library/jest-dom";
import "jest-axe/extend-expect";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// Mock IntersectionObserver
globalThis.IntersectionObserver = class {
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
} as unknown as typeof IntersectionObserver;

// Mock matchMedia
Object.defineProperty(globalThis, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

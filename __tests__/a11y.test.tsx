import { ITArchitectureStudio } from "@/components/organisms/ITArchitectureStudio";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// Mock React Flow
jest.mock("@xyflow/react", () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Background: () => <div>Background</div>,
  Controls: () => <div>Controls</div>,
  MiniMap: () => <div>MiniMap</div>,
  Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Handle: () => <div />,
  useNodesState: () => [[], jest.fn()],
  useEdgesState: () => [[], jest.fn()],
}));

describe("Accessibility", () => {
  it("ITArchitectureStudio should have no accessibility violations", async () => {
    const { container } = render(
      <ITArchitectureStudio
        nodes={[]}
        edges={[]}
        onNodesChange={jest.fn()}
        onEdgesChange={jest.fn()}
        onConnect={jest.fn()}
        transcript=""
      />,
    );

    // Explicitly configure axe to ignore specific rules if necessary, or just run it
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

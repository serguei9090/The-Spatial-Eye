import { HighlightCircle } from "@/components/atoms/HighlightCircle";
import { render } from "@testing-library/react";

describe("HighlightCircle Component", () => {
  const mockGeometry = {
    cx: 150,
    cy: 150,
    radius: 50,
    fittedRadius: 40,
    x: 100,
    y: 100,
    width: 100,
    height: 100,
  };

  it("renders correctly with given highlight data", () => {
    const { getByTestId } = render(
      <svg>
        <title>Highlight Test</title>
        <HighlightCircle
          id="test-1"
          label="test label"
          type="circle"
          geometry={mockGeometry}
        />
      </svg>,
    );
    expect(getByTestId("highlight-circle-test-1")).toBeDefined();
  });

  it("calculates position correctly based on normalized coordinates", () => {
    const { container } = render(
      <svg>
        <title>Highlight Test</title>
        <HighlightCircle
          id="test-1"
          label="test label"
          type="circle"
          geometry={mockGeometry}
        />
      </svg>,
    );

    const motionCircle = container.querySelector("circle");
    expect(motionCircle).toBeDefined();
    expect(motionCircle?.getAttribute("cx")).toBe("150");
    expect(motionCircle?.getAttribute("cy")).toBe("150");
  });
});

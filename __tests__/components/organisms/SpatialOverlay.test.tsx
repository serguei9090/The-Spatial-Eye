import { render, screen } from "@testing-library/react";

import { SpatialOverlay } from "@/components/organisms/SpatialOverlay";

describe("SpatialOverlay", () => {
  test("renders a highlight circle for valid coordinates", () => {
    render(
      <SpatialOverlay
        highlights={[
          {
            id: "h1",
            objectName: "cup",
            ymin: 100,
            xmin: 200,
            ymax: 300,
            xmax: 400,
            timestamp: Date.now(),
          },
        ]}
        videoWidth={1000}
        videoHeight={1000}
      />,
    );

    expect(screen.getByTestId("highlight-circle-h1")).toBeInTheDocument();
  });
});

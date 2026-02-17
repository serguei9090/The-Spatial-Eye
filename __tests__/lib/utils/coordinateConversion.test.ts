import { normalizedToPixels } from "@/lib/utils/coordinates";

describe("normalizedToPixels", () => {
  test("converts normalized coords to pixels", () => {
    const result = normalizedToPixels([150, 200, 350, 450], 1920, 1080);

    expect(result.top).toBe(162);
    expect(result.left).toBe(384);
    expect(result.bottom).toBe(378);
    expect(result.right).toBe(864);
  });
});

import { describe, expect, it } from "vitest";
import { getSliderValue } from "./slider";

describe("getSliderValue", () => {
  it("returns a single number as is", () => expect(getSliderValue(7)).toBe(7));
  it("returns the first thumb of an array", () => expect(getSliderValue([300, 500])).toBe(300));
});

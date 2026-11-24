import { describe, expect, it } from "vitest";
import { getFormattedNumber } from "@/lib/format";

describe("getFormattedNumber", () => {
  it("uses a decimal point in en, keeps trailing zeros, rounds to whole numbers and adds no separator below 10 000", () => {
    expect(getFormattedNumber("en", 12.34, 1)).toBe("12.3");
    expect(getFormattedNumber("en", 0, 1)).toBe("0.0");
    expect(getFormattedNumber("en", 3.4, 0)).toBe("3");
    expect(getFormattedNumber("en", 4321, 0)).toBe("4321");
  });

  it("uses a decimal comma in de-AT and adds no separator below 10 000", () => {
    expect(getFormattedNumber("de-AT", 12.34, 1)).toBe("12,3");
    expect(getFormattedNumber("de-AT", 0, 1)).toBe("0,0");
    expect(getFormattedNumber("de-AT", 4321, 0)).toBe("4321");
  });

  it("uses the locale it is given: the same value differs between en and de-AT", () => {
    expect(getFormattedNumber("en", 12.34, 1)).not.toBe(getFormattedNumber("de-AT", 12.34, 1));
  });
});

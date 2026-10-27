import { describe, expect, it } from "vitest";
import { formatGregorian, formatRange, localizeNumber, monthOffset, toKhmerNumerals } from "@/lib/date/format";

describe("date formatting", () => {
  it("converts to Khmer numerals", () => {
    expect(toKhmerNumerals(2570)).toBe("២៥៧០");
    expect(localizeNumber(27, "en")).toBe("27");
    expect(localizeNumber(27, "km")).toBe("២៧");
  });

  it("formats Gregorian dates without timezone shifts", () => {
    expect(formatGregorian("2026-10-27", "en")).toBe("27 October 2026");
    expect(formatGregorian("2026-10-27", "km")).toBe("២៧ តុលា ២០២៦");
    expect(formatRange("2026-10-10", "2026-10-12", "en")).toBe("10 October 2026 – 12 October 2026");
  });

  it("moves across year boundaries", () => {
    expect(monthOffset(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(monthOffset(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});

import { describe, expect, it } from "@jest/globals";

import {
  IterableDateTimeSchema,
  IterableISODateTimeSchema,
} from "../../src/types/common";

describe("Date Schema Transformations", () => {
  const testDate = new Date("2024-12-01T15:30:45.123Z");

  it("should transform to Iterable format (YYYY-MM-DD HH:MM:SS)", () => {
    expect(IterableDateTimeSchema.parse(testDate)).toBe("2024-12-01 15:30:45");
    expect(IterableDateTimeSchema.parse("2024-12-01T15:30:45Z")).toBe(
      "2024-12-01 15:30:45"
    );
  });

  it("should transform to ISO format", () => {
    expect(IterableISODateTimeSchema.parse(testDate)).toBe(
      "2024-12-01T15:30:45.123Z"
    );
  });

  it("should reject invalid dates", () => {
    expect(() => IterableDateTimeSchema.parse("invalid")).toThrow();
    expect(() => IterableISODateTimeSchema.parse("invalid")).toThrow();
  });
});

import { describe, expect, it } from "@jest/globals";
import { z } from "zod";

import { parseCsv, validateResponse } from "../../src/client/base.js";
import { IterableResponseValidationError } from "../../src/errors.js";

describe("validateResponse", () => {
  const schema = z.object({
    id: z.number(),
    name: z.string(),
  });

  it("should return parsed data for a valid response", () => {
    const response = {
      data: { id: 1, name: "test" },
      config: { url: "/api/test" },
    };

    const result = validateResponse(response, schema);
    expect(result).toEqual({ id: 1, name: "test" });
  });

  it("should throw IterableResponseValidationError for invalid data", () => {
    const response = {
      data: { id: "not-a-number", name: 123 },
      config: { url: "/api/test" },
    };

    expect(() => validateResponse(response, schema)).toThrow(
      IterableResponseValidationError
    );
  });

  it("should include the request URL in the error", () => {
    const response = {
      data: { bad: "data" },
      config: { url: "/api/some-endpoint" },
    };

    try {
      validateResponse(response, schema);
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(IterableResponseValidationError);
      expect(
        (error as IterableResponseValidationError).endpoint
      ).toBe("/api/some-endpoint");
    }
  });

  it("should work without a config/url", () => {
    const response = { data: { bad: "data" } };

    expect(() => validateResponse(response, schema)).toThrow(
      IterableResponseValidationError
    );
  });

  it("should pass through z.string() schemas", () => {
    const response = {
      data: "<html>Hello</html>",
      config: { url: "/api/preview" },
    };

    const result = validateResponse(response, z.string());
    expect(result).toBe("<html>Hello</html>");
  });
});

describe("parseCsv", () => {
  it("should parse valid CSV with headers into objects", () => {
    const response = {
      data: "name,age,city\nAlice,30,NYC\nBob,25,LA",
      config: { url: "/api/metrics" },
    } as any;

    const result = parseCsv(response);
    expect(result).toEqual([
      { name: "Alice", age: "30", city: "NYC" },
      { name: "Bob", age: "25", city: "LA" },
    ]);
  });

  it("should return empty array for empty data", () => {
    const response = { data: "", config: { url: "/api/metrics" } } as any;
    expect(parseCsv(response)).toEqual([]);
  });

  it("should return empty array for null/undefined data", () => {
    const response = { data: null, config: { url: "/api/metrics" } } as any;
    expect(parseCsv(response)).toEqual([]);
  });

  it("should trim whitespace from values", () => {
    const response = {
      data: "name, age\n Alice , 30 ",
      config: { url: "/api/metrics" },
    } as any;

    const result = parseCsv(response);
    expect(result).toEqual([{ name: "Alice", age: "30" }]);
  });

  it("should skip empty lines", () => {
    const response = {
      data: "name,age\nAlice,30\n\nBob,25\n",
      config: { url: "/api/metrics" },
    } as any;

    const result = parseCsv(response);
    expect(result).toHaveLength(2);
  });

  it("should throw IterableResponseValidationError for malformed CSV", () => {
    const response = {
      data: '"unclosed quote',
      config: { url: "/api/metrics" },
    } as any;

    expect(() => parseCsv(response)).toThrow(IterableResponseValidationError);
  });
});

import { describe, expect, it } from "@jest/globals";

import {
  createIterableError,
  isIterableApiError,
  isIterableRawError,
  IterableApiError,
  IterableNetworkError,
  IterableRawError,
} from "../../src/errors.js";

describe("Error Handling", () => {
  it("should create IterableApiError with API message", () => {
    const axiosError = {
      response: {
        status: 400,
        data: {
          code: "BadParams",
          msg: "Invalid subscription group ID",
          params: { field: "subscriptionGroupId" },
        },
      },
      config: { url: "/api/subscriptions" },
    };

    const error = createIterableError(axiosError);

    expect(error).toBeInstanceOf(IterableApiError);
    expect(error.message).toBe("Invalid subscription group ID");
    expect(isIterableApiError(error)).toBe(true);
    if (isIterableApiError(error)) {
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BadParams");
      expect(error.params).toEqual({ field: "subscriptionGroupId" });
      expect(error.isValidationError()).toBe(true);
      expect(error.isAuthError()).toBe(false);
    }
  });

  it("should include full API response in IterableApiError", () => {
    const axiosError = {
      response: {
        status: 401,
        data: {
          code: "BadApiKey",
          msg: "Invalid API key",
          params: { keyPrefix: "abc123" },
        },
      },
      config: { url: "/api/users" },
    };

    const error = createIterableError(axiosError);

    expect(error).toBeInstanceOf(IterableApiError);
    expect(isIterableApiError(error)).toBe(true);
    if (isIterableApiError(error)) {
      expect(error.isAuthError()).toBe(true);
      expect(error.code).toBe("BadApiKey");
      expect(error.params).toEqual({ keyPrefix: "abc123" });
    }
  });

  it("should create IterableRawError for malformed responses", () => {
    const axiosError = {
      response: {
        status: 400,
        data: { invalid: "response" },
      },
      config: { url: "/api/users" },
    };

    const error = createIterableError(axiosError);

    expect(error).toBeInstanceOf(IterableRawError);
    expect(isIterableRawError(error)).toBe(true);
    expect(isIterableApiError(error)).toBe(false);
    expect(error.message).toBe("HTTP 400 error"); // Fallback
    if (isIterableRawError(error)) {
      expect(error.statusCode).toBe(400);
      expect(error.rawResponse).toEqual({ invalid: "response" });
    }
  });

  it("should create IterableNetworkError for network failures", () => {
    const axiosError = {
      request: {},
      message: "Network Error",
    };

    const error = createIterableError(axiosError);

    expect(error).toBeInstanceOf(IterableNetworkError);
    expect(error.message).toBe(
      "Network error: No response received from Iterable API"
    );
  });

  it("should create IterableApiError for any valid response", () => {
    const axiosError = {
      response: {
        status: 503,
        data: {
          code: "GenericError",
          msg: "Service temporarily unavailable",
        },
      },
      config: { url: "/api/users" },
    };

    const error = createIterableError(axiosError);

    expect(error).toBeInstanceOf(IterableApiError);
    expect(isIterableApiError(error)).toBe(true);
    expect(isIterableRawError(error)).toBe(false);
    expect(error.message).toBe("Service temporarily unavailable");
    if (isIterableApiError(error)) {
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe("GenericError");
      expect(error.isAuthError()).toBe(false);
      expect(error.isValidationError()).toBe(false);
    }
  });

  it("should create IterableApiError for rate limit responses", () => {
    const axiosError = {
      response: {
        status: 429,
        data: {
          msg: "Exceeded rate limit.",
          code: "RateLimitExceeded",
        },
        headers: {
          "retry-after": "60",
        },
      },
      config: { url: "/api/users" },
    };

    const error = createIterableError(axiosError);

    expect(error).toBeInstanceOf(IterableApiError);
    expect(isIterableApiError(error)).toBe(true);
    if (isIterableApiError(error)) {
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe("RateLimitExceeded");
      expect(error.message).toBe("Exceeded rate limit.");
      expect(error.isRateLimitError()).toBe(true);
    }
  });

  it("should parse JSON error responses from text endpoints", () => {
    const axiosError = {
      response: {
        status: 401,
        data: '{"msg":"Invalid API key","code":"BadApiKey","params":{"ip":"192.184.158.61","endpoint":"/api/experiments/metrics"}}',
      },
      config: { url: "/api/experiments/metrics" },
    };

    const error = createIterableError(axiosError);

    expect(error).toBeInstanceOf(IterableApiError);
    expect(isIterableApiError(error)).toBe(true);
    if (isIterableApiError(error)) {
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Invalid API key");
      expect(error.code).toBe("BadApiKey");
      expect(error.apiResponse).toEqual({
        msg: "Invalid API key",
        code: "BadApiKey",
        params: {
          ip: "192.184.158.61",
          endpoint: "/api/experiments/metrics",
        },
      });
    }
  });

  it("should handle malformed JSON in text responses", () => {
    const axiosError = {
      response: {
        status: 500,
        data: '{"invalid": json}',
      },
      config: { url: "/api/experiments/metrics" },
    };

    const error = createIterableError(axiosError);

    expect(error).toBeInstanceOf(IterableRawError);
    if (isIterableRawError(error)) {
      expect(error.statusCode).toBe(500);
      expect(error.rawResponse).toBe('{"invalid": json}');
    }
  });

  it("should handle error responses with 'Success' code", () => {
    const axiosError = {
      response: {
        status: 400,
        data: {
          msg: "error.lists.invalidListId(999999999)",
          code: "Success", // Iterable sometimes returns Success for errors
          params: {
            projectId: 9079,
            listId: 999999999,
          },
        },
      },
      config: { url: "/api/lists/subscribe" },
    };

    const error = createIterableError(axiosError);

    expect(error).toBeInstanceOf(IterableApiError);
    expect(error.message).toBe("error.lists.invalidListId(999999999)");
    expect(isIterableApiError(error)).toBe(true);
    if (isIterableApiError(error)) {
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("Success");
      expect(error.params).toEqual({
        projectId: 9079,
        listId: 999999999,
      });
      expect(error.isValidationError()).toBe(true);
    }
  });

  it("should extract meaningful messages from HTML error pages", () => {
    const htmlResponse = `
      <!doctype html>
      <html>
        <head>
          <title>Action not found</title>
        </head>
        <body>
          <h2>Oh no- that url doesn't exist.</h2>
        </body>
      </html>
    `;

    const axiosError = {
      response: {
        status: 404,
        data: htmlResponse,
      },
      config: { url: "/api/campaigns/99999999" },
    };

    const error = createIterableError(axiosError);

    expect(error).toBeInstanceOf(IterableRawError);
    expect(error.message).toBe("Action not found"); // Extracted from HTML title
    if (isIterableRawError(error)) {
      expect(error.statusCode).toBe(404);
      expect(error.truncatedResponse).toContain("<!doctype html>");
    }
  });
});

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import axios from "axios";

// Automock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

import { BaseIterableClient } from "../../src/client/base.js";
// Import the real logger to spy on it
import { logger } from "../../src/logger.js";

describe("Debug Logging Sanitization", () => {
  let mockClientInstance: any;
  let requestInterceptor: any;
  let responseInterceptorError: any;

  let debugSpy: any;
  let errorSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Spy on logger methods
    // We use mockImplementation to silence the console output during tests
    debugSpy = jest.spyOn(logger, "debug").mockImplementation(() => logger);
    errorSpy = jest.spyOn(logger, "error").mockImplementation(() => logger);

    requestInterceptor = undefined;
    responseInterceptorError = undefined;

    mockClientInstance = {
      interceptors: {
        request: {
          use: jest.fn((callback) => {
            requestInterceptor = callback;
            return 0;
          }),
        },
        response: {
          use: jest.fn((success, error) => {
            responseInterceptorError = error;
            return 0;
          }),
        },
      },
      get: jest.fn(),
      defaults: { headers: {} },
    };

    if (jest.isMockFunction(mockedAxios.create)) {
      mockedAxios.create.mockReturnValue(mockClientInstance);
    } else {
      (mockedAxios as any).create = jest
        .fn()
        .mockReturnValue(mockClientInstance);
    }
  });

  it("should call axios.create and register interceptors", () => {
    new BaseIterableClient({
      apiKey: "test-api-key",
      baseUrl: "https://api.iterable.com",
      debug: true,
    });

    expect(mockedAxios.create).toHaveBeenCalled();
    expect(mockClientInstance.interceptors.request.use).toHaveBeenCalled();
    expect(requestInterceptor).toBeDefined();
  });

  it("should redact sensitive headers in debug logs", () => {
    new BaseIterableClient({
      apiKey: "test-api-key",
      baseUrl: "https://api.iterable.com",
      debug: true,
    });

    if (!requestInterceptor) throw new Error("Request interceptor missing");

    const requestConfig = {
      method: "get",
      url: "/test",
      headers: {
        Authorization: "Bearer secret-token",
        Cookie: "session=secret",
        "X-Custom": "safe",
        "Api-Key": "real-api-key",
      },
    };

    requestInterceptor(requestConfig);

    expect(debugSpy).toHaveBeenCalledWith(
      "API request",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Api-Key": "[REDACTED]",
          Authorization: "[REDACTED]",
          Cookie: "[REDACTED]",
          "X-Custom": "safe",
        }),
      })
    );
  });

  it("should NOT log error response data by default (debugVerbose=false)", async () => {
    new BaseIterableClient({
      apiKey: "test-api-key",
      baseUrl: "https://api.iterable.com",
      debug: true,
      debugVerbose: false,
    });

    if (!responseInterceptorError)
      throw new Error("Response interceptor missing");

    const sensitiveError = { message: "User email@example.com not found" };
    const errorResponse = {
      response: {
        status: 404,
        config: { url: "/error" },
        data: sensitiveError,
      },
    };

    try {
      await responseInterceptorError(errorResponse);
    } catch {
      // Expected
    }

    expect(errorSpy).toHaveBeenCalledWith(
      "API error",
      expect.objectContaining({
        status: 404,
      })
    );

    const errorLog = errorSpy.mock.calls.find(
      (call: any) => call[0] === "API error"
    );
    const errorData = errorLog?.[1] as any;

    expect(errorData.data).toBeUndefined();
  });

  it("should log error response data when debugVerbose is true", async () => {
    new BaseIterableClient({
      apiKey: "test-api-key",
      baseUrl: "https://api.iterable.com",
      debug: true,
      debugVerbose: true,
    });

    if (!responseInterceptorError)
      throw new Error("Response interceptor missing");

    const errorBody = { error: "details" };
    const errorResponse = {
      response: {
        status: 400,
        config: { url: "/error" },
        data: errorBody,
      },
    };

    try {
      await responseInterceptorError(errorResponse);
    } catch {
      // Expected
    }

    expect(errorSpy).toHaveBeenCalledWith(
      "API error",
      expect.objectContaining({
        status: 400,
        data: errorBody,
      })
    );
  });
});

import { IterableClient } from "../../src/client/index.js";

describe("IterableClient", () => {
  describe("Constructor with baseUrl", () => {
    it("should use US endpoint when explicitly provided", () => {
      const client = new IterableClient({
        apiKey: "a1b2c3d4e5f6789012345678901234ab",
        baseUrl: "https://api.iterable.com",
      });

      expect(client).toBeDefined();
      expect(client.client.defaults.baseURL).toBe("https://api.iterable.com");
    });

    it("should use EU endpoint when explicitly provided", () => {
      const client = new IterableClient({
        apiKey: "a1b2c3d4e5f6789012345678901234ab",
        baseUrl: "https://api.eu.iterable.com",
      });

      expect(client).toBeDefined();
      expect(client.client.defaults.baseURL).toBe(
        "https://api.eu.iterable.com"
      );
    });

    it("should use custom endpoint when provided", () => {
      const client = new IterableClient({
        apiKey: "a1b2c3d4e5f6789012345678901234ab",
        baseUrl: "https://custom.api.example.com",
      });

      expect(client).toBeDefined();
      expect(client.client.defaults.baseURL).toBe(
        "https://custom.api.example.com"
      );
    });

    it("should accept all valid IterableConfig properties", () => {
      const client = new IterableClient({
        apiKey: "a1b2c3d4e5f6789012345678901234ab",
        baseUrl: "https://api.iterable.com",
        timeout: 45000,
        debug: false,
        debugVerbose: true,
        customHeaders: {
          "X-Custom-1": "value1",
          "X-Custom-2": "value2",
        },
      });

      expect(client).toBeDefined();

      // Verify axios configuration
      expect(client.client.defaults.baseURL).toBe("https://api.iterable.com");
      expect(client.client.defaults.timeout).toBe(45000);

      // Verify API key is set in headers
      expect(client.client.defaults.headers["Api-Key"]).toBe(
        "a1b2c3d4e5f6789012345678901234ab"
      );

      // Verify custom headers are merged into defaults
      expect(client.client.defaults.headers["X-Custom-1"]).toBe("value1");
      expect(client.client.defaults.headers["X-Custom-2"]).toBe("value2");

      // Verify standard headers are still present
      expect(client.client.defaults.headers["Content-Type"]).toBe(
        "application/json"
      );
      expect(client.client.defaults.headers["User-Agent"]).toContain(
        "iterable-api"
      );
    });
  });

  describe("Constructor with Injected Client", () => {
    it("should use the injected axios instance ignoring baseUrl config", () => {
      const mockAxios = {
        defaults: {
          // note this is the axios instance's baseURL, not the IterableConfig's baseUrl
          baseURL: "https://mock.example.com",
        },
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      } as any;

      const client = new IterableClient(
        {
          apiKey: "a1b2c3d4e5f6789012345678901234ab",
          baseUrl: "https://api.iterable.com",
        },
        mockAxios
      );

      expect(client).toBeDefined();
      expect(client.client).toBe(mockAxios);
      // The injected client's baseURL should be preserved, not overridden
      expect(client.client.defaults.baseURL).toBe("https://mock.example.com");
    });
  });
});

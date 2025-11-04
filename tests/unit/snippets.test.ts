import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import { IterableClient } from "../../src/client";
import {
  CreateSnippetRequestSchema,
  SnippetResponseSchema,
  UpdateSnippetRequestSchema,
} from "../../src/types/snippets.js";
import { createMockClient, createMockSnippet } from "../utils/test-helpers";

describe("Snippets Management", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getSnippets", () => {
    it("should call snippets endpoint without parameters", async () => {
      const mockResponse = { data: { snippets: [createMockSnippet()] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getSnippets();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/snippets", {
        signal: undefined,
      });
    });

    it("should return snippets array", async () => {
      const mockSnippet = createMockSnippet();
      const mockResponse = { data: { snippets: [mockSnippet] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getSnippets();

      expect(result).toHaveProperty("snippets");
      expect(Array.isArray(result.snippets)).toBe(true);
      expect(result.snippets).toHaveLength(1);
      expect(result.snippets[0]).toEqual(mockSnippet);
    });

    it("should handle empty snippets response", async () => {
      const mockResponse = { data: { snippets: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getSnippets();

      expect(result).toHaveProperty("snippets");
      expect(Array.isArray(result.snippets)).toBe(true);
      expect(result.snippets).toHaveLength(0);
    });

    it("should handle abort signal", async () => {
      const mockResponse = { data: { snippets: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      const abortController = new AbortController();

      await client.getSnippets({ signal: abortController.signal });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/snippets", {
        signal: abortController.signal,
      });
    });
  });

  describe("createSnippet", () => {
    it("should call POST endpoint with correct data", async () => {
      const mockResponse = { data: { snippetId: 12345 } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const params = {
        name: "test-snippet",
        content: "<p>Hello {{name}}!</p>",
        description: "Test snippet",
        variables: ["name"],
      };

      await client.createSnippet(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/snippets",
        params,
        undefined
      );
    });

    it("should return snippet ID", async () => {
      const mockResponse = { data: { snippetId: 12345 } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const params = {
        name: "test-snippet",
        content: "<p>Hello {{name}}!</p>",
      };

      const result = await client.createSnippet(params);

      expect(result).toHaveProperty("snippetId", 12345);
    });
  });

  describe("getSnippet", () => {
    it("should call snippet endpoint with string identifier", async () => {
      const mockSnippet = createMockSnippet();
      const mockResponse = { data: { snippet: mockSnippet } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getSnippet({ identifier: "test-snippet" });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/snippets/test-snippet",
        { signal: undefined }
      );
    });

    it("should call snippet endpoint with numeric identifier", async () => {
      const mockSnippet = createMockSnippet();
      const mockResponse = { data: { snippet: mockSnippet } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getSnippet({ identifier: 12345 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/snippets/12345",
        { signal: undefined }
      );
    });

    it("should return snippet details", async () => {
      const mockSnippet = createMockSnippet();
      const mockResponse = { data: { snippet: mockSnippet } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getSnippet({ identifier: "test-snippet" });

      expect(result).toHaveProperty("snippet");
      expect(result.snippet).toEqual(mockSnippet);
    });
  });

  describe("updateSnippet", () => {
    it("should call PUT endpoint with correct data", async () => {
      const mockResponse = { data: { snippetId: 12345 } };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const params = {
        content: "<p>Updated content {{name}}!</p>",
        description: "Updated description",
      };

      await client.updateSnippet({ identifier: "test-snippet" }, params);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/api/snippets/test-snippet",
        params,
        undefined
      );
    });

    it("should return snippet ID", async () => {
      const mockResponse = { data: { snippetId: 12345 } };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const params = {
        content: "<p>Updated content!</p>",
      };

      const result = await client.updateSnippet({ identifier: 12345 }, params);

      expect(result).toHaveProperty("snippetId", 12345);
    });
  });

  describe("deleteSnippet", () => {
    it("should call DELETE endpoint with string identifier", async () => {
      const mockResponse = { data: { snippetId: 12345 } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      await client.deleteSnippet({ identifier: "test-snippet" });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/api/snippets/test-snippet",
        { signal: undefined }
      );
    });

    it("should call DELETE endpoint with numeric identifier", async () => {
      const mockResponse = { data: { snippetId: 12345 } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      await client.deleteSnippet({ identifier: 12345 });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/api/snippets/12345",
        { signal: undefined }
      );
    });

    it("should return snippet ID", async () => {
      const mockResponse = { data: { snippetId: 12345 } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await client.deleteSnippet({ identifier: "test-snippet" });

      expect(result).toHaveProperty("snippetId", 12345);
    });
  });

  describe("Schema Validation", () => {
    it("should validate snippet response schema", () => {
      const validSnippet = createMockSnippet();

      // Valid snippet
      expect(() => SnippetResponseSchema.parse(validSnippet)).not.toThrow();

      // Test required fields
      expect(() =>
        SnippetResponseSchema.parse({ ...validSnippet, content: undefined })
      ).toThrow();

      expect(() =>
        SnippetResponseSchema.parse({ ...validSnippet, name: undefined })
      ).toThrow();

      expect(() =>
        SnippetResponseSchema.parse({ ...validSnippet, createdAt: undefined })
      ).toThrow();
    });

    it("should validate create snippet request schema", () => {
      const validRequest = {
        name: "test-snippet",
        content: "<p>Hello {{name}}!</p>",
        description: "Test snippet",
        variables: ["name"],
      };

      // Valid request
      expect(() =>
        CreateSnippetRequestSchema.parse(validRequest)
      ).not.toThrow();

      // Missing required fields
      expect(() =>
        CreateSnippetRequestSchema.parse({ ...validRequest, name: undefined })
      ).toThrow();

      expect(() =>
        CreateSnippetRequestSchema.parse({
          ...validRequest,
          content: undefined,
        })
      ).toThrow();

      // Optional fields should work
      expect(() =>
        CreateSnippetRequestSchema.parse({
          name: "test",
          content: "<p>Test</p>",
        })
      ).not.toThrow();
    });

    it("should validate update snippet request schema", () => {
      const validRequest = {
        content: "<p>Updated content {{name}}!</p>",
        description: "Updated description",
        variables: ["name"],
      };

      // Valid request
      expect(() =>
        UpdateSnippetRequestSchema.parse(validRequest)
      ).not.toThrow();

      // Content is required for updates
      expect(() =>
        UpdateSnippetRequestSchema.parse({
          ...validRequest,
          content: undefined,
        })
      ).toThrow();

      // Other fields are optional
      expect(() =>
        UpdateSnippetRequestSchema.parse({ content: "<p>Test</p>" })
      ).not.toThrow();
    });
  });
});

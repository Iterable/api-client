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
  CreateListParamsSchema,
  DeleteListParamsSchema,
  GetListUsersParamsSchema,
  UnsubscribeFromListParamsSchema,
} from "../../src/types/lists.js";
import { createMockClient, TEST_USER_EMAIL } from "../utils/test-helpers";

describe("List Management", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("subscribeUserToList", () => {
    it("should subscribe users to list", async () => {
      const mockResponse = {
        data: {
          successCount: 1,
          failCount: 0,
          createdFields: [],
          filteredOutFields: [],
        },
      };
      const options = {
        listId: 123,
        subscribers: [{ email: TEST_USER_EMAIL }],
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.subscribeUserToList(options);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/lists/subscribe",
        options
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.successCount).toBe(1);
      expect(result.failCount).toBe(0);
    });

    it("should handle subscription failures", async () => {
      const mockResponse = {
        data: {
          successCount: 0,
          failCount: 1,
          createdFields: [],
          filteredOutFields: [],
          failedUpdates: {
            invalidEmails: ["invalid@email"],
          },
          invalidEmails: ["invalid@email"], // deprecated field
        },
      };
      const options = {
        listId: 123,
        subscribers: [{ email: "invalid@email" }],
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.subscribeUserToList(options);

      expect(result.successCount).toBe(0);
      expect(result.failCount).toBe(1);
      expect(result.failedUpdates?.invalidEmails).toContain("invalid@email");
    });
  });

  describe("unsubscribeUserFromList", () => {
    it("should unsubscribe users from list", async () => {
      const mockResponse = {
        data: {
          successCount: 1,
          failCount: 0,
          createdFields: [],
          filteredOutFields: [],
        },
      };
      const options = {
        listId: 123,
        subscribers: [{ email: TEST_USER_EMAIL }],
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.unsubscribeUserFromList(options);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/lists/unsubscribe",
        options
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.successCount).toBe(1);
      expect(result.failCount).toBe(0);
    });
  });

  describe("getListUsers", () => {
    it("should parse plain text user list response", async () => {
      const mockResponse = { data: "user1@example.com\nuser2@example.com\n" };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getListUsers({ listId: 123 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/lists/getUsers?listId=123",
        {}
      );
      expect(result.users).toHaveLength(2);
      expect(result.users[0]?.email).toBe("user1@example.com");
      expect(result.users[1]?.email).toBe("user2@example.com");
    });

    it("should handle empty plain text response", async () => {
      const mockResponse = { data: "" };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getListUsers({ listId: 123 });

      expect(result.users).toEqual([]);
    });

    it("should handle whitespace-only response", async () => {
      const mockResponse = { data: "\n\n\n" };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getListUsers({ listId: 123 });

      expect(result.users).toEqual([]);
    });
  });

  describe("List Operations", () => {
    describe("getListSize", () => {
      it("should get list size", async () => {
        const mockResponse = {
          data: "1500", // API returns a string
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.getListSize({ listId: 123 });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/api/lists/123/size"
        );
        expect(result).toEqual({ size: 1500 });
      });
    });

    describe("getListPreviewUsers", () => {
      it("should preview users in a list", async () => {
        const mockResponse = {
          data: "user1@example.com\nuser2@example.com\nuser3@example.com",
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.getListPreviewUsers({ listId: 123 });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/api/lists/previewUsers?listId=123"
        );
        expect(result).toEqual({
          users: [
            "user1@example.com",
            "user2@example.com",
            "user3@example.com",
          ],
        });
      });

      it("should preview users with optional parameters", async () => {
        const mockResponse = {
          data: "userId1\nuserId2",
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const params = {
          listId: 123,
          preferUserId: true,
          size: 100,
        };
        const result = await client.getListPreviewUsers(params);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/api/lists/previewUsers?listId=123&preferUserId=true&size=100"
        );
        expect(result).toEqual({
          users: ["userId1", "userId2"],
        });
      });

      it("should handle empty response", async () => {
        const mockResponse = {
          data: "",
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.getListPreviewUsers({ listId: 123 });

        expect(result).toEqual({ users: [] });
      });
    });
  });

  describe("Schema Validation", () => {
    it("should validate list management parameters", () => {
      // Valid get_list_users
      expect(() =>
        GetListUsersParamsSchema.parse({
          listId: 123,
          maxResults: 500,
        })
      ).not.toThrow();

      // Valid create_list
      expect(() =>
        CreateListParamsSchema.parse({
          name: "Test List",
          description: "A test list",
        })
      ).not.toThrow();

      // Valid delete_list
      expect(() =>
        DeleteListParamsSchema.parse({
          listId: 123,
        })
      ).not.toThrow();

      // Valid unsubscribe_from_list
      expect(() =>
        UnsubscribeFromListParamsSchema.parse({
          listId: 123,
          subscribers: [{ email: "test@example.com" }],
        })
      ).not.toThrow();

      // Invalid maxResults (too high)
      expect(() =>
        GetListUsersParamsSchema.parse({
          listId: 123,
          maxResults: 2000,
        })
      ).toThrow();
    });
  });
});

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
  GetUserByEmailParamsSchema,
  UpdateEmailParamsSchema,
  UpdateUserParamsSchema,
  UpdateUserSubscriptionsParamsSchema,
} from "../../src/types/users.js";
import { createMockClient, TEST_USER_EMAIL } from "../utils/test-helpers";

describe("User Management", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserByEmail", () => {
    it("should URL encode email addresses with special characters", async () => {
      const emailWithSpecialChars = "test+user@example.com";
      const mockResponse = { data: { user: { email: emailWithSpecialChars } } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getUserByEmail(emailWithSpecialChars);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/users/${encodeURIComponent(emailWithSpecialChars)}`,
        { signal: undefined }
      );
    });

    it("should return user data", async () => {
      const mockResponse = {
        data: {
          user: {
            email: TEST_USER_EMAIL,
            userId: "user123",
            dataFields: { firstName: "Test" },
          },
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getUserByEmail(TEST_USER_EMAIL);

      expect(result.user.email).toBe(TEST_USER_EMAIL);
      expect(result.user.userId).toBe("user123");
    });
  });

  describe("getUserByUserId", () => {
    it("should call correct endpoint with userId", async () => {
      const userId = "user123";
      const mockResponse = {
        data: { user: { email: TEST_USER_EMAIL, userId } },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getUserByUserId(userId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/users/byUserId/${userId}`,
        {}
      );
    });
  });

  describe("deleteUserByEmail", () => {
    it("should URL encode email addresses", async () => {
      const emailWithSpecialChars = "test+user@example.com";
      const mockResponse = { data: { code: "Success", msg: "Deleted" } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      await client.deleteUserByEmail(emailWithSpecialChars);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        `/api/users/${encodeURIComponent(emailWithSpecialChars)}`
      );
    });
  });

  describe("deleteUserByUserId", () => {
    it("should URL encode userId", async () => {
      const userId = "user/123";
      const mockResponse = { data: { code: "Success", msg: "Deleted" } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      await client.deleteUserByUserId(userId);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        `/api/users/byUserId/${encodeURIComponent(userId)}`
      );
    });
  });

  describe("updateEmail", () => {
    it("should update email using currentEmail", async () => {
      const params = {
        currentEmail: "old@example.com",
        newEmail: "new@example.com",
      };
      const mockResponse = { data: { code: "Success", msg: "Email updated" } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.updateEmail(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/users/updateEmail",
        params
      );
    });

    it("should update email using currentUserId", async () => {
      const params = {
        currentUserId: "user123",
        newEmail: "new@example.com",
      };
      const mockResponse = { data: { code: "Success", msg: "Email updated" } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.updateEmail(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/users/updateEmail",
        params
      );
    });
  });

  describe("updateUserSubscriptions", () => {
    it("should update subscriptions by email", async () => {
      const params = {
        email: TEST_USER_EMAIL,
        emailListIds: [123, 456],
        unsubscribedChannelIds: [789],
      };
      const mockResponse = { data: { code: "Success", msg: "Updated" } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.updateUserSubscriptions(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/users/updateSubscriptions",
        params
      );
    });

    it("should update subscriptions by userId", async () => {
      const params = {
        userId: "user123",
        subscribedMessageTypeIds: [111, 222],
        unsubscribedMessageTypeIds: [333],
      };
      const mockResponse = { data: { code: "Success", msg: "Updated" } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.updateUserSubscriptions(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/users/updateSubscriptions",
        params
      );
    });

    it("should support validateChannelAlignment parameter", async () => {
      const params = {
        email: TEST_USER_EMAIL,
        subscribedMessageTypeIds: [111],
        validateChannelAlignment: false,
      };
      const mockResponse = { data: { code: "Success", msg: "Updated" } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.updateUserSubscriptions(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/users/updateSubscriptions",
        params
      );
    });
  });

  describe("bulkUpdateUsers", () => {
    it("should return proper bulk update response", async () => {
      const mockResponse = {
        data: {
          successCount: 2,
          failCount: 0,
          createdFields: [],
          filteredOutFields: [],
        },
      };
      const users = [
        { email: "user1@example.com", dataFields: { firstName: "User1" } },
        { email: "user2@example.com", dataFields: { firstName: "User2" } },
      ];
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.bulkUpdateUsers({ users });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/users/bulkUpdate",
        { users }
      );
      expect(result.successCount).toBe(2);
      expect(result.failCount).toBe(0);
    });

    it("should handle bulk update failures", async () => {
      const mockResponse = {
        data: {
          successCount: 1,
          failCount: 1,
          createdFields: ["newField"],
          filteredOutFields: ["droppedField"],
          failedUpdates: {
            invalidEmails: ["bad@email"],
          },
        },
      };
      const users = [
        { email: "good@example.com", dataFields: { firstName: "Good" } },
        { email: "bad@email", dataFields: { firstName: "Bad" } },
      ];
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.bulkUpdateUsers({ users });

      expect(result.successCount).toBe(1);
      expect(result.failCount).toBe(1);
      expect(result.createdFields).toContain("newField");
      expect(result.filteredOutFields).toContain("droppedField");
      expect(result.failedUpdates?.invalidEmails).toContain("bad@email");
    });
  });

  describe("getSentMessages", () => {
    it("should build complex query parameters", async () => {
      const mockResponse = { data: { messages: [], totalCount: 0 } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getSentMessages({
        email: TEST_USER_EMAIL,
        limit: 50,
        campaignIds: [123, 456],
        startDateTime: "2023-01-01T00:00:00Z",
        endDateTime: "2023-12-31T23:59:59Z",
        excludeBlastCampaigns: true,
        messageMedium: "Email",
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/users/getSentMessages?email=test%2Bmcptest%40example.com&limit=50&campaignIds=123&campaignIds=456&startDateTime=2023-01-01T00%3A00%3A00Z&endDateTime=2023-12-31T23%3A59%3A59Z&excludeBlastCampaigns=true&messageMedium=Email"
      );
    });
  });

  describe("Schema Validation", () => {
    it("should validate get_user_by_email parameters", () => {
      expect(() =>
        GetUserByEmailParamsSchema.parse({
          email: "test@example.com",
        })
      ).not.toThrow();

      expect(() =>
        GetUserByEmailParamsSchema.parse({
          email: "invalid-email",
        })
      ).toThrow();
    });

    it("should validate update_user parameters", () => {
      expect(() =>
        UpdateUserParamsSchema.parse({
          email: "test@example.com",
          dataFields: { firstName: "Test" },
        })
      ).not.toThrow();

      expect(() =>
        UpdateUserParamsSchema.parse({
          // Missing both email and userId
          dataFields: { firstName: "Test" },
        })
      ).toThrow();
    });

    it("should validate updateEmail parameters", () => {
      // Valid with currentEmail
      expect(() =>
        UpdateEmailParamsSchema.parse({
          currentEmail: "old@example.com",
          newEmail: "new@example.com",
        })
      ).not.toThrow();

      // Valid with currentUserId
      expect(() =>
        UpdateEmailParamsSchema.parse({
          currentUserId: "user123",
          newEmail: "new@example.com",
        })
      ).not.toThrow();

      // Invalid - missing both
      expect(() =>
        UpdateEmailParamsSchema.parse({
          newEmail: "new@example.com",
        })
      ).toThrow();

      // Invalid - bad email format
      expect(() =>
        UpdateEmailParamsSchema.parse({
          currentEmail: "invalid-email",
          newEmail: "new@example.com",
        })
      ).toThrow();
    });

    it("should validate updateUserSubscriptions parameters", () => {
      // Valid with email
      expect(() =>
        UpdateUserSubscriptionsParamsSchema.parse({
          email: "test@example.com",
          emailListIds: [123],
        })
      ).not.toThrow();

      // Valid with userId
      expect(() =>
        UpdateUserSubscriptionsParamsSchema.parse({
          userId: "user123",
          subscribedMessageTypeIds: [456],
        })
      ).not.toThrow();

      // Invalid - missing both
      expect(() =>
        UpdateUserSubscriptionsParamsSchema.parse({
          emailListIds: [123],
        })
      ).toThrow();

      // Valid with all optional fields
      expect(() =>
        UpdateUserSubscriptionsParamsSchema.parse({
          email: "test@example.com",
          emailListIds: [123, 456],
          subscribedMessageTypeIds: [111, 222],
          unsubscribedChannelIds: [789],
          unsubscribedMessageTypeIds: [333],
          campaignId: 999,
          templateId: 888,
          validateChannelAlignment: false,
        })
      ).not.toThrow();
    });
  });
});

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import { IterableClient } from "../../src/client/index.js";
import {
  createIterableError,
  isIterableApiError,
  IterableApiError,
} from "../../src/errors.js";
// MCP tools import removed - this belongs in the MCP server package
import { IterableSuccessResponseSchema } from "../../src/types/common.js";
import { createMockClient } from "../utils/test-helpers.js";

describe("Subscription Management", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("bulkUpdateSubscriptions", () => {
    it("should use PUT method with correct URL and query parameter", async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} });

      await client.bulkUpdateSubscriptions({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        action: "subscribe",
        users: ["test@example.com"],
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/api/subscriptions/emailList/123?action=subscribe",
        { users: ["test@example.com"], usersByUserId: undefined }
      );
    });

    it("should properly encode subscription group names with special characters", async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} });

      await client.bulkUpdateSubscriptions({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        action: "subscribe",
        users: ["test@example.com"],
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/api/subscriptions/emailList/123?action=subscribe",
        { users: ["test@example.com"], usersByUserId: undefined }
      );
    });

    it("should include both users arrays in request body", async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} });

      await client.bulkUpdateSubscriptions({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        action: "subscribe",
        users: ["user1@example.com"],
        usersByUserId: ["user2"],
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/api/subscriptions/emailList/123?action=subscribe",
        {
          users: ["user1@example.com"],
          usersByUserId: ["user2"],
        }
      );
    });

    it("should include undefined fields in request body", async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} });

      await client.bulkUpdateSubscriptions({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        action: "unsubscribe",
        users: ["user@example.com"],
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/api/subscriptions/emailList/123?action=unsubscribe",
        {
          users: ["user@example.com"],
          usersByUserId: undefined,
        }
      );
    });

    it("should accept all valid subscription group types", async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: {} });

      const validGroups: Array<"emailList" | "messageType" | "messageChannel"> =
        ["emailList", "messageType", "messageChannel"];

      for (const group of validGroups) {
        await client.bulkUpdateSubscriptions({
          subscriptionGroup: group,
          subscriptionGroupId: 123,
          action: "subscribe",
          users: ["test@example.com"],
        });
      }

      expect(mockAxiosInstance.put).toHaveBeenCalledTimes(3);
    });

    it("should return response data from API", async () => {
      const expectedData = { code: "Success", msg: "Users subscribed" };
      mockAxiosInstance.put.mockResolvedValue({ data: expectedData });

      const result = await client.bulkUpdateSubscriptions({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        action: "subscribe",
        users: ["test@example.com"],
      });

      expect(result).toEqual(expectedData);
    });

    it("should validate response against schema", async () => {
      const validResponse = { code: "Success", msg: "Users subscribed" };
      mockAxiosInstance.put.mockResolvedValue({ data: validResponse });

      const result = await client.bulkUpdateSubscriptions({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        action: "subscribe",
        users: ["test@example.com"],
      });

      // Validate the response matches the expected schema
      const validation = IterableSuccessResponseSchema.safeParse(result);
      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.code).toBe("Success");
        expect(validation.data.msg).toBe("Users subscribed");
      }
    });
  });

  describe("subscribeUserByEmail", () => {
    it("should use PATCH method with correct URL", async () => {
      mockAxiosInstance.patch.mockResolvedValue({ data: {} });

      await client.subscribeUserByEmail({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        userEmail: "test@example.com",
      });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/api/subscriptions/emailList/123/user/test%40example.com"
      );
    });

    it("should properly encode email addresses with special characters", async () => {
      mockAxiosInstance.patch.mockResolvedValue({ data: {} });

      await client.subscribeUserByEmail({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        userEmail: "user+test@example.com",
      });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/api/subscriptions/emailList/123/user/user%2Btest%40example.com"
      );
    });

    it("should return response data from API", async () => {
      const expectedData = { code: "Success", msg: "User subscribed" };
      mockAxiosInstance.patch.mockResolvedValue({ data: expectedData });

      const result = await client.subscribeUserByEmail({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        userEmail: "test@example.com",
      });

      expect(result).toEqual(expectedData);
    });

    it("should validate response against schema", async () => {
      const validResponse = { code: "Success", msg: "User subscribed" };
      mockAxiosInstance.patch.mockResolvedValue({ data: validResponse });

      const result = await client.subscribeUserByEmail({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        userEmail: "test@example.com",
      });

      // Validate the response matches the expected schema
      const validation = IterableSuccessResponseSchema.safeParse(result);
      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.code).toBe("Success");
      }
    });
  });

  describe("subscribeUserByUserId", () => {
    it("should use PATCH method with correct URL", async () => {
      mockAxiosInstance.patch.mockResolvedValue({ data: {} });

      await client.subscribeUserByUserId({
        subscriptionGroup: "messageType",
        subscriptionGroupId: 456,
        userId: "user123",
      });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/api/subscriptions/messageType/456/byUserId/user123"
      );
    });

    it("should properly encode user IDs with special characters", async () => {
      mockAxiosInstance.patch.mockResolvedValue({ data: {} });

      await client.subscribeUserByUserId({
        subscriptionGroup: "messageType",
        subscriptionGroupId: 456,
        userId: "user/123",
      });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/api/subscriptions/messageType/456/byUserId/user%2F123"
      );
    });
  });

  describe("unsubscribeUserByEmail", () => {
    it("should use DELETE method with correct URL", async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await client.unsubscribeUserByEmail({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        userEmail: "test@example.com",
      });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/api/subscriptions/emailList/123/user/test%40example.com"
      );
    });

    it("should properly encode email addresses with special characters", async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await client.unsubscribeUserByEmail({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        userEmail: "user+test@example.com",
      });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/api/subscriptions/emailList/123/user/user%2Btest%40example.com"
      );
    });
  });

  describe("unsubscribeUserByUserId", () => {
    it("should use DELETE method with correct URL", async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await client.unsubscribeUserByUserId({
        subscriptionGroup: "messageType",
        subscriptionGroupId: 456,
        userId: "user123",
      });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/api/subscriptions/messageType/456/byUserId/user123"
      );
    });

    it("should properly encode user IDs with special characters", async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await client.unsubscribeUserByUserId({
        subscriptionGroup: "messageType",
        subscriptionGroupId: 456,
        userId: "user/123",
      });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/api/subscriptions/messageType/456/byUserId/user%2F123"
      );
    });
  });

  describe("Response Validation", () => {
    it("should validate success responses against schema", async () => {
      const successResponse = {
        code: "Success",
        msg: "Users subscribed successfully",
        params: { processedCount: 2 },
      };
      mockAxiosInstance.put.mockResolvedValue({ data: successResponse });

      const result = await client.bulkUpdateSubscriptions({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        action: "subscribe",
        users: ["test@example.com"],
      });

      // Validate the success response matches the expected schema
      const validation = IterableSuccessResponseSchema.safeParse(result);
      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.code).toBe("Success");
        expect(validation.data.msg).toBe("Users subscribed successfully");
        expect(validation.data.params).toEqual({ processedCount: 2 });
      }
    });

    it("should reject non-success response codes", async () => {
      const invalidResponse = {
        code: "BadRequest",
        msg: "This would normally be thrown as an exception by the base client",
      };
      mockAxiosInstance.put.mockResolvedValue({ data: invalidResponse });

      const result = await client.bulkUpdateSubscriptions({
        subscriptionGroup: "emailList",
        subscriptionGroupId: 123,
        action: "subscribe",
        users: ["test@example.com"],
      });

      // This should fail validation because only "Success" code is allowed in actual responses
      // (HTTP errors are thrown as exceptions by the base client)
      const validation = IterableSuccessResponseSchema.safeParse(result);
      expect(validation.success).toBe(false);
      if (!validation.success) {
        expect(validation.error.issues.length).toBeGreaterThan(0);
        expect(validation.error?.issues[0]?.code).toBe("invalid_value");
        expect(validation.error?.issues[0]?.path).toEqual(["code"]);
      }
    });

    it("should handle HTTP errors with proper Iterable API error parsing", async () => {
      const errorResponse = {
        code: "BadParams", // Use official API code from schema
        msg: "Invalid subscription group ID",
        params: { invalidField: "subscriptionGroupId" },
      };

      // Simulate HTTP 400 error that would be caught by the interceptor
      const axiosError = {
        response: {
          status: 400,
          data: errorResponse,
        },
        config: {
          url: "/api/subscriptions/emailList/123?action=subscribe",
        },
      };

      // Create the proper error that would be thrown by the interceptor
      const expectedError = createIterableError(axiosError);
      mockAxiosInstance.put.mockRejectedValue(expectedError);

      await expect(
        client.bulkUpdateSubscriptions({
          subscriptionGroup: "emailList",
          subscriptionGroupId: 123,
          action: "subscribe",
          users: ["test@example.com"],
        })
      ).rejects.toThrow(IterableApiError);

      await expect(
        client.bulkUpdateSubscriptions({
          subscriptionGroup: "emailList",
          subscriptionGroupId: 123,
          action: "subscribe",
          users: ["test@example.com"],
        })
      ).rejects.toThrow("Invalid subscription group ID");

      // Verify the error includes the full API response
      try {
        await client.bulkUpdateSubscriptions({
          subscriptionGroup: "emailList",
          subscriptionGroupId: 123,
          action: "subscribe",
          users: ["test@example.com"],
        });
      } catch (error) {
        expect(error).toBeInstanceOf(IterableApiError);
        expect(isIterableApiError(error)).toBe(true);
        if (isIterableApiError(error)) {
          expect(error.isValidationError()).toBe(true);
          expect(error.code).toBe("BadParams");
          expect(error.params).toEqual({ invalidField: "subscriptionGroupId" });
        }
      }
    });
  });
});

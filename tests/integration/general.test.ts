import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import { isIterableApiError } from "../../src/errors";
import { expectAuthError } from "../utils/error-matchers";
import {
  cleanupTestUser,
  createTestIdentifiers,
  uniqueId,
  waitForUserUpdate,
  withTimeout,
} from "../utils/test-helpers";

describe("General Integration Tests", () => {
  let client: IterableClient;
  const { testUserEmail, testUserId } = createTestIdentifiers();

  beforeAll(async () => {
    client = new IterableClient();
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);
    client.destroy();
  });

  describe("Error Handling", () => {
    it("should handle invalid API key", async () => {
      const invalidClient = new IterableClient({
        apiKey: "invalid-api-key",
        baseUrl: "https://api.iterable.com",
      });

      await expectAuthError(withTimeout(invalidClient.getCampaigns()));
    });

    it("should handle malformed email addresses", async () => {
      // API may return different error formats, so just check for error
      await expect(
        withTimeout(
          client.updateUser({
            email: "not-an-email",
            dataFields: { test: "value" },
          })
        )
      ).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("should handle user not found gracefully", async () => {
      const nonExistentEmail = `nonexistent+${uniqueId()}@example.com`;

      // For non-existent users, Iterable API returns an empty object
      const userResponse = await withTimeout(
        client.getUserByEmail(nonExistentEmail)
      );

      expect(userResponse).toEqual({});
    });

    it("should handle rate limiting gracefully", async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array.from({ length: 5 }, () =>
        withTimeout(client.getCampaigns())
      );

      try {
        await Promise.all(promises);
        // If all succeed, that's fine - rate limiting might not be triggered
      } catch (error: any) {
        // If rate limited, should get IterableApiError with 429 status
        if (isIterableApiError(error) && error.isRateLimitError()) {
          expect(error.statusCode).toBe(429);
        } else {
          // Re-throw if it's a different error
          throw error;
        }
      }
    });
  });

  describe("Data Consistency", () => {
    it("should maintain data consistency across operations", async () => {
      const testData = {
        email: testUserEmail,
        userId: testUserId,
        dataFields: {
          consistencyTest: uniqueId(),
          timestamp: Date.now(),
          operationCount: 1,
        },
      };

      // Create user with initial data
      await withTimeout(client.updateUser(testData));

      // Update the same user with modified data
      const updatedData = {
        ...testData,
        dataFields: {
          ...testData.dataFields,
          operationCount: 2,
          lastUpdate: new Date().toISOString(),
        },
      };

      await withTimeout(client.updateUser(updatedData));

      // Wait for eventual consistency using the helper
      const userResponse = await waitForUserUpdate(client, testUserEmail, {
        consistencyTest: testData.dataFields.consistencyTest,
        operationCount: 2,
      });

      expect(userResponse.user.email).toBe(testUserEmail);
      expect(userResponse.user.dataFields?.consistencyTest).toBe(
        testData.dataFields.consistencyTest
      );
      expect(userResponse.user.dataFields?.operationCount).toBe(2);
      expect(userResponse.user.dataFields?.lastUpdate).toBeDefined();
    });
  });
});

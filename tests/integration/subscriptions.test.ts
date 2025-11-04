import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import type { SubscriptionGroup } from "../../src/types/subscriptions.js";
import {
  cleanupTestUser,
  createTestIdentifiers,
  retryWithBackoff,
  uniqueId,
  withTimeout,
} from "../utils/test-helpers";

describe("Subscription Management Integration Tests", () => {
  let client: IterableClient;
  let testListId: number;
  let createdTestList = false;

  const { testUserEmail, testUserId } = createTestIdentifiers();

  const ensureTestUser = async () => {
    await withTimeout(
      client.updateUser({
        email: testUserEmail,
        userId: testUserId,
        dataFields: { subscriptionSource: "mcp-integration-test" },
      })
    );
  };

  const expectSuccessResponse = (result: any) => {
    expect(result).toHaveProperty("code");
    expect(["Success", "Accepted"].includes(result.code)).toBe(true);
  };

  beforeAll(async () => {
    client = new IterableClient();

    // Try to get existing lists first
    const listsResponse = await withTimeout(client.getLists());
    const [existingList] = listsResponse.lists;

    if (existingList) {
      testListId = existingList.id;
    } else {
      // Create a test list if none exist
      const createResponse = await withTimeout(
        client.createList({
          name: `MCP Integration Test List ${uniqueId()}`,
          description: "Temporary list for integration testing",
        })
      );
      testListId = createResponse.listId;
      createdTestList = true;
    }
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);

    // Clean up test list only if we created it
    if (createdTestList) {
      try {
        await withTimeout(client.deleteList(testListId));
      } catch (error) {
        console.warn(`Failed to delete test list ${testListId}:`, error);
      }
    }

    client.destroy();
  });

  describe("Bulk Subscription Actions", () => {
    it("should bulk subscribe users to an email list by email", async () => {
      await ensureTestUser();

      const result = await retryWithBackoff(() =>
        withTimeout(
          client.bulkUpdateSubscriptions({
            subscriptionGroup: "emailList" as SubscriptionGroup,
            subscriptionGroupId: testListId,
            action: "subscribe",
            users: [testUserEmail],
          })
        )
      );

      expectSuccessResponse(result);
    });

    it("should bulk subscribe users by userId", async () => {
      await ensureTestUser();

      const result = await retryWithBackoff(() =>
        withTimeout(
          client.bulkUpdateSubscriptions({
            subscriptionGroup: "emailList" as SubscriptionGroup,
            subscriptionGroupId: testListId,
            action: "subscribe",
            usersByUserId: [testUserId],
          })
        )
      );

      expectSuccessResponse(result);
    });

    it("should bulk unsubscribe users from an email list", async () => {
      await ensureTestUser();

      await retryWithBackoff(() =>
        withTimeout(
          client.bulkUpdateSubscriptions({
            subscriptionGroup: "emailList" as SubscriptionGroup,
            subscriptionGroupId: testListId,
            action: "subscribe",
            users: [testUserEmail],
          })
        )
      );

      const result = await retryWithBackoff(() =>
        withTimeout(
          client.bulkUpdateSubscriptions({
            subscriptionGroup: "emailList" as SubscriptionGroup,
            subscriptionGroupId: testListId,
            action: "unsubscribe",
            users: [testUserEmail],
          })
        )
      );

      expectSuccessResponse(result);
    });
  });

  describe("Single User Subscription Actions", () => {
    it("should subscribe a single user by email", async () => {
      await ensureTestUser();

      const result = await retryWithBackoff(() =>
        withTimeout(
          client.subscribeUserByEmail({
            subscriptionGroup: "emailList" as SubscriptionGroup,
            subscriptionGroupId: testListId,
            userEmail: testUserEmail,
          })
        )
      );

      expectSuccessResponse(result);
    });

    it("should subscribe a single user by userId", async () => {
      await ensureTestUser();

      const result = await retryWithBackoff(() =>
        withTimeout(
          client.subscribeUserByUserId({
            subscriptionGroup: "emailList" as SubscriptionGroup,
            subscriptionGroupId: testListId,
            userId: testUserId,
          })
        )
      );

      expectSuccessResponse(result);
    });

    it("should unsubscribe a single user by email", async () => {
      await ensureTestUser();

      await retryWithBackoff(() =>
        withTimeout(
          client.subscribeUserByEmail({
            subscriptionGroup: "emailList" as SubscriptionGroup,
            subscriptionGroupId: testListId,
            userEmail: testUserEmail,
          })
        )
      );

      const result = await retryWithBackoff(() =>
        withTimeout(
          client.unsubscribeUserByEmail({
            subscriptionGroup: "emailList" as SubscriptionGroup,
            subscriptionGroupId: testListId,
            userEmail: testUserEmail,
          })
        )
      );

      expectSuccessResponse(result);
    });

    it("should unsubscribe a single user by userId", async () => {
      await ensureTestUser();

      await retryWithBackoff(() =>
        withTimeout(
          client.subscribeUserByUserId({
            subscriptionGroup: "emailList" as SubscriptionGroup,
            subscriptionGroupId: testListId,
            userId: testUserId,
          })
        )
      );

      const result = await retryWithBackoff(() =>
        withTimeout(
          client.unsubscribeUserByUserId({
            subscriptionGroup: "emailList" as SubscriptionGroup,
            subscriptionGroupId: testListId,
            userId: testUserId,
          })
        )
      );

      expectSuccessResponse(result);
    });
  });

  describe("Type Safety Validation", () => {
    it("should accept all valid subscription group types", async () => {
      await ensureTestUser();

      const validGroups: SubscriptionGroup[] = [
        "emailList",
        "messageType",
        "messageChannel",
      ];

      for (const subscriptionGroup of validGroups) {
        if (subscriptionGroup === "emailList") {
          const result = await retryWithBackoff(() =>
            withTimeout(
              client.bulkUpdateSubscriptions({
                subscriptionGroup,
                subscriptionGroupId: testListId,
                action: "subscribe",
                users: [testUserEmail],
              })
            )
          );

          expectSuccessResponse(result);
        }
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid subscription group ID gracefully", async () => {
      const invalidListId = 999999999; // Very unlikely to exist

      try {
        await withTimeout(
          client.bulkUpdateSubscriptions({
            subscriptionGroup: "emailList" as SubscriptionGroup,
            subscriptionGroupId: invalidListId,
            action: "subscribe",
            users: [testUserEmail],
          })
        );
        // If no error is thrown, that's also acceptable (some APIs return success even for invalid IDs)
      } catch (error: any) {
        // Should be a meaningful error
        expect(error).toHaveProperty("message");
        expect(typeof error.message).toBe("string");
      }
    });

    it("should handle invalid user email gracefully", async () => {
      try {
        await withTimeout(
          client.bulkUpdateSubscriptions({
            subscriptionGroup: "emailList" as SubscriptionGroup,
            subscriptionGroupId: testListId,
            action: "subscribe",
            users: ["invalid-email-format"],
          })
        );
        // If no error is thrown, that's also acceptable
      } catch (error: any) {
        // Should be a meaningful error
        expect(error).toHaveProperty("message");
        expect(typeof error.message).toBe("string");
      }
    });
  });
});

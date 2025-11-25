import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import {
  cleanupTestUser,
  createTestIdentifiers,
  retryWithBackoff,
  uniqueId,
  waitForUserUpdate,
  withTimeout,
} from "../utils/test-helpers";

describe("User Management Integration Tests", () => {
  let client: IterableClient;
  const { testUserEmail, testUserId } = createTestIdentifiers();

  beforeAll(async () => {
    client = new IterableClient();
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);
    client.destroy();
  });

  it("should create and retrieve a user", async () => {
    const userData = {
      email: testUserEmail,
      userId: testUserId,
      dataFields: {
        firstName: "Test",
        lastName: "User",
        testField: "integration-test",
        createdAt: new Date().toISOString(),
      },
      preferUserId: true,
      mergeNestedObjects: true,
    };

    // Create/update user - success is indicated by no exception being thrown
    await withTimeout(client.updateUser(userData));

    // ✅ VERIFY: User was actually created/updated with correct data
    const userResponse = await waitForUserUpdate(client, testUserEmail, {
      firstName: "Test",
      lastName: "User",
      testField: "integration-test",
    });

    // ✅ VERIFY: User data is correct (already retrieved by waitForUserUpdate)
    expect(userResponse.user?.email).toBe(testUserEmail);
    expect(userResponse.user?.userId).toBe(testUserId);
  });

  it("should get user by email using getUserByEmail", async () => {
    await withTimeout(
      client.updateUser({
        email: testUserEmail,
        userId: testUserId,
        dataFields: { testField: "email-test" },
      })
    );

    // ✅ VERIFY: User update was processed
    await waitForUserUpdate(client, testUserEmail, {
      testField: "email-test",
    });

    // ✅ VERIFY: User can be retrieved by email
    const userResponse = await withTimeout(
      client.getUserByEmail(testUserEmail)
    );
    expect(userResponse.user?.email).toBe(testUserEmail);
    expect(userResponse.user?.dataFields?.testField).toBe("email-test");
  });

  it("should get user by userId using getUserByUserId", async () => {
    await withTimeout(
      client.updateUser({
        email: testUserEmail,
        userId: testUserId,
        dataFields: { testField: "userId-test" },
      })
    );

    // ✅ VERIFY: User update was processed
    await waitForUserUpdate(client, testUserEmail, {
      testField: "userId-test",
    });

    // ✅ VERIFY: User can be retrieved by userId
    const userResponse = await withTimeout(client.getUserByUserId(testUserId));
    expect(userResponse.user?.userId).toBe(testUserId);
    expect(userResponse.user?.email).toBe(testUserEmail);
    expect(userResponse.user?.dataFields?.testField).toBe("userId-test");
  });

  it("should update user data fields", async () => {
    const updateTimestamp = Date.now(); // Use numeric timestamp to match existing field type
    const updatedData = {
      email: testUserEmail,
      dataFields: {
        firstName: "Updated",
        lastName: "Name",
        updateTimestamp,
      },
      mergeNestedObjects: true,
    };

    // Update user - success indicated by no exception
    await withTimeout(client.updateUser(updatedData));

    // ✅ VERIFY: Update was actually applied (with eventual consistency)
    await waitForUserUpdate(client, testUserEmail, {
      firstName: "Updated",
      lastName: "Name",
      updateTimestamp,
    });
  });

  it("should handle bulk user updates", async () => {
    const testId = uniqueId();
    const timestamp = Date.now();
    const users = [
      {
        email: `bulk1+${testId}@example.com`,
        dataFields: { firstName: "Bulk1", testType: "bulk", timestamp },
      },
      {
        email: `bulk2+${testId}@example.com`,
        dataFields: { firstName: "Bulk2", testType: "bulk", timestamp },
      },
    ];

    // Bulk update - success indicated by no exception
    await withTimeout(client.bulkUpdateUsers({ users }));

    try {
      // ✅ VERIFY: All users were actually created/updated
      await Promise.all(
        users.map((user) =>
          waitForUserUpdate(client, user.email, {
            firstName: user.dataFields.firstName,
            testType: "bulk",
            timestamp,
          })
        )
      );
    } finally {
      // Cleanup
      await Promise.all(
        users.map((user) => cleanupTestUser(client, user.email))
      );
    }
  });

  it("should get sent messages for user", async () => {
    // First ensure we have a user with some activity
    await withTimeout(
      client.updateUser({
        email: testUserEmail,
        dataFields: { messageTest: true },
      })
    );

    const result = await withTimeout(
      client.getSentMessages({
        email: testUserEmail,
        limit: 10,
      })
    );

    expect(result).toBeDefined();
    expect(result.messages).toBeDefined();
    expect(Array.isArray(result.messages)).toBe(true);
  });

  it("should get sent messages with filtering", async () => {
    // First ensure we have a user with some activity
    await withTimeout(
      client.updateUser({
        email: testUserEmail,
        dataFields: { messageFilterTest: true },
      })
    );

    const result = await withTimeout(
      client.getSentMessages({
        email: testUserEmail,
        limit: 5,
        messageMedium: "Email",
        excludeBlastCampaigns: true,
      })
    );

    expect(result).toBeDefined();
    expect(result.messages).toBeDefined();
    expect(Array.isArray(result.messages)).toBe(true);
  });

  it("should get user fields", async () => {
    const result = await withTimeout(client.getUserFields());

    expect(result).toBeDefined();
    expect(result.fields).toBeDefined();
    expect(typeof result.fields).toBe("object");

    // Should return field definitions for the Iterable project
    const fieldCount = Object.keys(result.fields).length;
    expect(fieldCount).toBeGreaterThan(0);

    // Each field maps to its type as a string
    Object.entries(result.fields).forEach(([fieldName, fieldType]) => {
      expect(typeof fieldName).toBe("string");
      expect(fieldName.length).toBeGreaterThan(0);
      expect(typeof fieldType).toBe("string");
      expect(fieldType.length).toBeGreaterThan(0);
    });

    // Should include common user fields
    expect(result.fields).toHaveProperty("email");
    expect(result.fields).toHaveProperty("userId");
  });

  it("should delete user by email using deleteUserByEmail", async () => {
    const deleteTestId = uniqueId();
    const deleteTestEmail = `delete-by-email-test+${deleteTestId}@example.com`;

    // Create a user to delete
    await withTimeout(
      client.updateUser({
        email: deleteTestEmail,
        dataFields: { deleteTest: true },
      })
    );

    // Wait for user to be created
    await waitForUserUpdate(client, deleteTestEmail, { deleteTest: true });

    // Delete the user
    const deleteResponse = await withTimeout(
      client.deleteUserByEmail(deleteTestEmail)
    );

    expect(deleteResponse.code).toBe("Success");
  });

  it("should delete user by userId using deleteUserByUserId", async () => {
    const deleteTestId = uniqueId();
    const deleteTestEmail = `delete-by-userid-test+${deleteTestId}@example.com`;
    const deleteTestUserId = `delete-userid-${deleteTestId}`;

    // Create a user to delete with preferUserId to ensure userId is primary
    await withTimeout(
      client.updateUser({
        email: deleteTestEmail,
        userId: deleteTestUserId,
        dataFields: { deleteUserIdTest: true },
        preferUserId: true,
      })
    );

    // Wait for user to be created and verify userId is set
    await waitForUserUpdate(client, deleteTestEmail, {
      deleteUserIdTest: true,
    });

    // Also verify we can retrieve by userId before deleting (with retry for eventual consistency)
    await retryWithBackoff(
      async () => {
        const userCheck = await client.getUserByUserId(deleteTestUserId);
        if (!userCheck.user?.userId) {
          throw new Error("userId not set on user profile yet");
        }
        expect(userCheck.user.userId).toBe(deleteTestUserId);
      },
      {
        description: `User ${deleteTestUserId} to be retrievable by userId`,
        timeoutMs: 30000,
      }
    );

    // Delete the user by userId with retry in case of timing issues
    const deleteResponse = await retryWithBackoff(
      async () => {
        return await client.deleteUserByUserId(deleteTestUserId);
      },
      {
        description: `Delete user by userId ${deleteTestUserId}`,
        timeoutMs: 20000,
        shouldRetryOnError: (error: any) => {
          // Retry on "User does not exist" errors (might be eventual consistency)
          return error?.message?.includes("User does not exist");
        },
      }
    );

    expect(deleteResponse.code).toBe("Success");
  });

  it("should update user email address", async () => {
    const updateEmailTestId = uniqueId();
    const oldEmail = `old-email-test+${updateEmailTestId}@example.com`;
    const newEmail = `new-email-test+${updateEmailTestId}@example.com`;

    try {
      // Create user with old email
      await withTimeout(
        client.updateUser({
          email: oldEmail,
          dataFields: { emailUpdateTest: true },
        })
      );

      // Wait for user to be created
      await waitForUserUpdate(client, oldEmail, { emailUpdateTest: true });

      // Update the email
      const updateResponse = await withTimeout(
        client.updateEmail({
          currentEmail: oldEmail,
          newEmail: newEmail,
        })
      );

      expect(updateResponse.code).toBe("Success");

      // Verify user now exists with new email
      // Note: There may be some delay in email updates
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const userResponse = await withTimeout(client.getUserByEmail(newEmail));
      expect(userResponse.user?.email).toBe(newEmail);
    } finally {
      // Cleanup both possible emails
      await cleanupTestUser(client, oldEmail);
      await cleanupTestUser(client, newEmail);
    }
  });

  it("should update user subscriptions", async () => {
    // First ensure user exists
    await withTimeout(
      client.updateUser({
        email: testUserEmail,
        userId: testUserId,
        dataFields: { subscriptionTest: true },
      })
    );

    await waitForUserUpdate(client, testUserEmail, { subscriptionTest: true });

    // Update subscriptions - this operation overwrites existing subscription data
    const updateResponse = await withTimeout(
      client.updateUserSubscriptions({
        email: testUserEmail,
        emailListIds: [], // Empty array for this test
        // Note: In a real scenario you'd use actual list/channel/messageType IDs
      })
    );

    expect(updateResponse.code).toBe("Success");
  });

  it("should update user subscriptions by userId", async () => {
    // Ensure user exists with userId
    await withTimeout(
      client.updateUser({
        email: testUserEmail,
        userId: testUserId,
        dataFields: { subscriptionUserIdTest: true },
      })
    );

    await waitForUserUpdate(client, testUserEmail, {
      subscriptionUserIdTest: true,
    });

    // Update subscriptions using userId
    const updateResponse = await withTimeout(
      client.updateUserSubscriptions({
        userId: testUserId,
        emailListIds: [],
      })
    );

    expect(updateResponse.code).toBe("Success");
  });
});

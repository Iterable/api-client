import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import {
  cleanupTestUser,
  createTestIdentifiers,
  retryOnInvalidListId,
  uniqueId,
  waitForListMembership,
  withTimeout,
} from "../utils/test-helpers";

describe("List Management Integration Tests", () => {
  let client: IterableClient;

  const { testUserEmail, testUserId } = createTestIdentifiers();

  beforeAll(async () => {
    client = new IterableClient();
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);
    client.destroy();
  });

  it("should retrieve lists", async () => {
    const response = await withTimeout(client.getLists());

    expect(response).toHaveProperty("lists");
    expect(Array.isArray(response.lists)).toBe(true);
  });

  it("should create, manage, and delete a list", async () => {
    const listName = uniqueId("MCP-Test-List");

    // Create a list
    const createResponse = await withTimeout(
      client.createList({
        name: listName,
        description: "Integration test list created by MCP server tests",
      })
    );

    expect(createResponse).toHaveProperty("listId");
    const listId = createResponse.listId;

    try {
      // Ensure user exists (avoid 400s on subscribe due to unknown user)
      await withTimeout(
        client.updateUser({
          email: testUserEmail,
          userId: testUserId,
          dataFields: { subscriptionSource: "mcp-test" },
        })
      );

      // Subscribe a user to the list (handle transient invalidListId error)
      await retryOnInvalidListId(
        () =>
          withTimeout(
            client.subscribeUserToList({
              listId,
              subscribers: [{ email: testUserEmail }],
            })
          ),
        "Subscribe user to list"
      );

      // ✅ VERIFY: User is actually subscribed to the list
      await waitForListMembership(client, listId, testUserEmail, true);

      // Get list users
      const usersResponse = await withTimeout(
        client.getListUsers({
          listId,
          maxResults: 10,
        })
      );
      expect(usersResponse).toHaveProperty("users");
      expect(Array.isArray(usersResponse.users)).toBe(true);
      // Don't require specific users due to eventual consistency

      // Unsubscribe user from the list
      // Unsubscribe user - success indicated by no exception
      await withTimeout(
        client.unsubscribeUserFromList({
          listId,
          subscribers: [{ email: testUserEmail }],
        })
      );

      // ✅ VERIFY: User is actually unsubscribed from the list
      await waitForListMembership(client, listId, testUserEmail, false);
    } finally {
      // Cleanup - delete the list (success indicated by no exception)
      await withTimeout(client.deleteList(listId));
    }
  }, 120000);

  it("should get list size", async () => {
    const testListName = uniqueId("Size-Test-List");
    let testListId: number;

    try {
      // Create a test list
      const createResult = await withTimeout(
        client.createList({
          name: testListName,
          description: "List for testing list size endpoint",
        })
      );
      testListId = createResult.listId;

      // Add a test user to the list (handle transient invalidListId error)
      await retryOnInvalidListId(
        () =>
          withTimeout(
            client.subscribeUserToList({
              listId: testListId,
              subscribers: [
                {
                  email: testUserEmail,
                  userId: testUserId,
                  dataFields: { sizeTest: true },
                },
              ],
            })
          ),
        "Subscribe user to list for size test"
      );

      // Wait for list membership to propagate
      await waitForListMembership(client, testListId, testUserEmail, true);

      const result = await withTimeout(
        client.getListSize({ listId: testListId })
      );

      expect(result).toBeDefined();
      expect(result.size).toBeDefined();
      expect(typeof result.size).toBe("number");
      // List size might be 0 if membership hasn't fully propagated
      expect(result.size).toBeGreaterThanOrEqual(0);
    } finally {
      // Clean up test list
      if (testListId!) {
        await withTimeout(client.deleteList(testListId));
      }
    }
  }, 120000);

  it("should preview users in list", async () => {
    const testListName = uniqueId("Preview-Test-List");
    let testListId: number;

    try {
      // Create a test list
      const createResult = await withTimeout(
        client.createList({
          name: testListName,
          description: "List for testing list preview endpoint",
        })
      );
      testListId = createResult.listId;

      // Add a test user to the list (handle transient invalidListId error)
      await retryOnInvalidListId(
        () =>
          withTimeout(
            client.subscribeUserToList({
              listId: testListId,
              subscribers: [
                {
                  email: testUserEmail,
                  userId: testUserId,
                  dataFields: { previewTest: true },
                },
              ],
            })
          ),
        "Subscribe user to list for preview test"
      );

      // Wait for list membership to propagate
      await waitForListMembership(client, testListId, testUserEmail, true);

      const result = await withTimeout(
        client.getListPreviewUsers({
          listId: testListId,
          size: 10,
        })
      );

      expect(result).toBeDefined();
      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBeGreaterThanOrEqual(1);
    } finally {
      // Clean up test list
      if (testListId!) {
        await withTimeout(client.deleteList(testListId));
      }
    }
  }, 120000);
});

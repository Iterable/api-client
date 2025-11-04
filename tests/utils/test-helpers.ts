import { jest } from "@jest/globals";
import { randomUUID } from "crypto";

import { IterableClient } from "../../src/client";
import { config } from "../../src/config.js";
import { logger } from "../../src/logger.js";
import type { GetCatalogItemsResponse } from "../../src/types/catalogs.js";
import type { UserEvent, UserResponse } from "../../src/types/users.js";

// Constants for unit tests
export const TEST_USER_EMAIL = "test+mcptest@example.com";
export const TEST_USER_ID = "mcp-test-user-001";

export function uniqueId(prefix = "") {
  return prefix ? `${prefix}-${randomUUID()}` : randomUUID();
}

/**
 * Generate unique test identifiers for a test suite
 */
export function createTestIdentifiers() {
  const testRunId = uniqueId();
  return {
    testRunId,
    testUserEmail: `test+mcptest+${testRunId}@example.com`,
    testUserId: `mcp-test-user-${testRunId}`,
  };
}

/**
 * Create an IterableClient with a mocked axios instance for unit tests
 */
export function createMockClient(): {
  client: IterableClient;
  mockAxiosInstance: any;
} {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
  };
  const client = new IterableClient(
    { apiKey: "test", baseUrl: "https://api.iterable.com" },
    mockAxiosInstance
  );
  return { client, mockAxiosInstance };
}

export function generateTestEvent(overrides: Partial<any> = {}) {
  return {
    email: TEST_USER_EMAIL,
    eventName: "test_event",
    dataFields: { testProperty: "testValue" },
    ...overrides,
  };
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms = config.TEST_TIMEOUT
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Timeout after ${ms}ms`)),
      ms
    );
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
}

export async function cleanupTestUser(client: IterableClient, email: string) {
  if (!config.CLEANUP_TEST_DATA) {
    logger.debug(`Skipping cleanup for ${email} (CLEANUP_TEST_DATA=false)`);
    return;
  }

  try {
    await client.deleteUserByEmail(email);
    logger.debug(`Cleaned up test user: ${email}`);
  } catch (error) {
    logger.warn(`Failed to cleanup user ${email}:`, error);
  }
}

// Minimal mock functions for unit tests
export function createMockIterableResponse(overrides: any = {}) {
  return {
    msg: "Success",
    code: "Success",
    params: {},
    ...overrides,
  };
}
export function createMockUserResponse(overrides: any = {}) {
  return {
    user: {
      email: TEST_USER_EMAIL,
      userId: TEST_USER_ID,
      dataFields: {
        firstName: "Test",
        lastName: "User",
        ...overrides.dataFields,
      },
      profileUpdatedAt: new Date().toISOString(),
      ...overrides.user,
    },
  };
}
export function createMockCampaign(overrides: any = {}) {
  return {
    id: 12345,
    name: "Test Campaign",
    type: "Blast",
    campaignState: "Draft",
    messageMedium: "Email",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdByUserId: "test@example.com",
    templateId: 67890,
    listIds: [1, 2, 3],
    suppressionListIds: [4, 5],
    labels: ["test", "campaign"],
    sendSize: 1000,
    startAt: Date.now() + 3600000,
    recurringCampaignId: 11111,
    workflowId: 22222,
    ...overrides,
  };
}
export function createMockTemplate(overrides: any = {}) {
  return {
    templateId: 67890,
    name: "Test Template",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    creatorUserId: "test@example.com",
    messageTypeId: 40404,
    // Email-specific fields
    subject: "Test Subject",
    fromName: "Test Sender",
    fromEmail: "test@example.com",
    html: "<html><body>Test content</body></html>",
    plainText: "Test content",
    ...overrides,
  };
}

export function createMockSnippet(overrides: any = {}) {
  return {
    content: "<p>Hello {{firstName}}!</p>",
    createdAt: new Date().toISOString(),
    createdBy: "test@example.com",
    description: "Test snippet description",
    id: 12345,
    name: "test-snippet",
    projectId: 83,
    updatedAt: new Date().toISOString(),
    updatedBy: "test@example.com",
    variables: ["firstName"],
    ...overrides,
  };
}

export function createMockList(overrides: any = {}) {
  return {
    id: 123,
    name: "Test List",
    size: 100,
    listType: "Static",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  {
    timeoutMs = 30000,
    initialIntervalMs = 2000,
    maxIntervalMs = 20000,
    backoffMultiplier = 2,
    description = "operation",
    shouldRetryOnError = () => true,
  }: {
    timeoutMs?: number;
    initialIntervalMs?: number;
    maxIntervalMs?: number;
    backoffMultiplier?: number;
    description?: string;
    shouldRetryOnError?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const startTime = Date.now();

  const attempt = async (
    currentInterval: number,
    attemptCount: number
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error: any) {
      const elapsedTime = Date.now() - startTime;

      function formatError(error: any, prefix: string): string {
        const statusCode = error?.statusCode || error?.response?.status;
        const errorData =
          error?.apiResponse ||
          error?.response?.data ||
          error?.message ||
          "Unknown error";
        return `${prefix}${statusCode ? ` (${statusCode})` : ""}: ${typeof errorData === "string" ? errorData : JSON.stringify(errorData)}`;
      }

      if (!shouldRetryOnError(error)) {
        throw new Error(formatError(error, `${description} failed`));
      }

      if (elapsedTime >= timeoutMs) {
        throw new Error(
          formatError(
            error,
            `${description} timeout after ${timeoutMs}ms (${attemptCount} attempts)`
          )
        );
      }

      // Wait with current interval, then retry with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, currentInterval));

      const nextInterval = Math.min(
        maxIntervalMs,
        currentInterval * backoffMultiplier + Math.random() * 100
      );

      return attempt(nextInterval, attemptCount + 1);
    }
  };

  return attempt(initialIntervalMs, 1);
}

export function retryOnInvalidListId<T>(
  operation: () => Promise<T>,
  name = "List operation"
) {
  return retryWithBackoff(operation, {
    description: name,
    shouldRetryOnError: (error: any) =>
      (error?.statusCode === 400 || error?.response?.status === 400) &&
      (error?.message?.includes?.("invalidListId") ||
        error?.response?.data?.msg?.includes?.("invalidListId")),
  });
}

export function retryRateLimited<T>(
  operation: () => Promise<T>,
  description = "Rate limited operation"
): Promise<T> {
  return retryWithBackoff(operation, {
    timeoutMs: 60000,
    description,
    shouldRetryOnError: (error: any) =>
      (error?.name === "IterableApiError" && error?.statusCode === 429) ||
      error?.statusCode === 429 ||
      error?.response?.status === 429,
  });
}

export async function waitForUserUpdate(
  client: IterableClient,
  email: string,
  expectedDataFields: Record<string, any>
): Promise<UserResponse> {
  return retryWithBackoff(
    async () => {
      const userResponse = await client.getUserByEmail(email);
      const actualDataFields = userResponse.user.dataFields || {};
      const missingFields = Object.entries(expectedDataFields).filter(
        ([key, expectedValue]) => actualDataFields[key] !== expectedValue
      );
      if (missingFields.length > 0) {
        throw new Error(
          `User fields not updated: ${missingFields.map(([key, expected]) => `${key}=${expected}`).join(", ")}`
        );
      }
      return userResponse;
    },
    {
      description: `User ${email} fields to update`,
      timeoutMs: 60000,
    }
  );
}

export async function waitForEventToAppear(
  client: IterableClient,
  identifier: { email: string } | { userId: string },
  eventName: string,
  expectedDataFields?: Record<string, any>
): Promise<UserEvent> {
  const identifierStr =
    "email" in identifier ? identifier.email : identifier.userId;
  const identifierType = "email" in identifier ? "email" : "userId";

  return retryWithBackoff(
    async () => {
      const eventsResponse =
        "email" in identifier
          ? await client.getUserEventsByEmail({
              email: identifier.email,
              limit: 50,
            })
          : await client.getUserEventsByUserId({
              userId: identifier.userId,
              limit: 50,
            });

      const matchingEvent = eventsResponse.events?.find((event: any) => {
        if (event.eventName !== eventName) return false;
        if (expectedDataFields) {
          return Object.entries(expectedDataFields).every(
            ([key, expectedValue]) => {
              const actualValue = event.dataFields?.[key];
              return actualValue === expectedValue;
            }
          );
        }
        return true;
      });
      if (!matchingEvent) throw new Error("Event not found");
      return matchingEvent;
    },
    {
      description: `Event '${eventName}' to appear for ${identifierType} ${identifierStr}`,
      timeoutMs: 60000,
    }
  );
}

export async function waitForListMembership(
  client: IterableClient,
  listId: number,
  email: string,
  shouldBeSubscribed: boolean
): Promise<void> {
  return retryWithBackoff(
    async () => {
      const listUsersResponse = await client.getListUsers({
        listId,
        maxResults: 1000,
      });
      if (!listUsersResponse?.users) {
        throw new Error("Invalid response from getListUsers API");
      }

      const userInList = listUsersResponse.users.some(
        (user) => user.email === email
      );
      if (userInList !== shouldBeSubscribed) {
        throw new Error(
          `User ${email} membership status is ${userInList}, expected ${shouldBeSubscribed}`
        );
      }
    },
    {
      description: `List membership for ${email} to be ${shouldBeSubscribed}`,
      timeoutMs: 60000,
    }
  );
}

export async function waitForCatalogItems(
  client: IterableClient,
  catalogName: string,
  expectedItemIds: string[]
): Promise<GetCatalogItemsResponse> {
  return retryWithBackoff(
    async () => {
      const catalogItemsResponse = await client.getCatalogItems({
        catalogName,
      });
      if (!catalogItemsResponse?.catalogItemsWithProperties?.length) {
        throw new Error("No catalog items found");
      }
      const itemIds = catalogItemsResponse.catalogItemsWithProperties.map(
        (item: any) => item.itemId
      );
      const missingItems = expectedItemIds.filter(
        (expectedId) => !itemIds.includes(expectedId)
      );
      if (missingItems.length > 0) {
        throw new Error(`Missing catalog items: ${missingItems.join(", ")}`);
      }
      return catalogItemsResponse;
    },
    {
      description: `Catalog items ${expectedItemIds.join(", ")} to appear in ${catalogName}`,
      timeoutMs: 60000,
    }
  );
}

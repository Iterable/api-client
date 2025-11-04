import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
// import { expectValidationError } from "../utils/error-matchers";
import {
  cleanupTestUser,
  createTestIdentifiers,
  withTimeout,
} from "../utils/test-helpers";

describe("Journeys Integration Tests", () => {
  let client: IterableClient;
  const { testUserEmail } = createTestIdentifiers();

  beforeAll(async () => {
    client = new IterableClient();
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);
    client.destroy();
  });

  it("should get journeys", async () => {
    const result = await withTimeout(client.getJourneys());

    expect(result).toBeDefined();
    expect(result.journeys).toBeDefined();
    expect(Array.isArray(result.journeys)).toBe(true);
    expect(result).toHaveProperty("totalJourneysCount");
    expect(typeof result.totalJourneysCount).toBe("number");
  });

  it("should get journeys with pagination", async () => {
    const result = await withTimeout(
      client.getJourneys({ page: 1, pageSize: 5 })
    );

    expect(result).toBeDefined();
    expect(result.journeys).toBeDefined();
    expect(Array.isArray(result.journeys)).toBe(true);
    expect(result).toHaveProperty("totalJourneysCount");
    expect(typeof result.totalJourneysCount).toBe("number");

    // Should not return more than the page size
    expect(result.journeys.length).toBeLessThanOrEqual(5);

    // Verify journey structure if any journeys exist
    if (result.journeys.length > 0) {
      const journey = result.journeys[0];
      expect(journey).toHaveProperty("id");
      expect(journey).toHaveProperty("name");
      expect(journey).toHaveProperty("journeyType");
      expect(journey).toHaveProperty("enabled");
      expect(journey).toHaveProperty("isArchived");
    }
  });

  it("should get journeys with state filter", async () => {
    const result = await withTimeout(
      client.getJourneys({ state: ["Archived"], pageSize: 3 })
    );

    expect(result).toBeDefined();
    expect(result.journeys).toBeDefined();
    expect(Array.isArray(result.journeys)).toBe(true);
    expect(result).toHaveProperty("totalJourneysCount");

    // Should not return more than the page size
    expect(result.journeys.length).toBeLessThanOrEqual(3);
  });

  it("should navigate between pages correctly", async () => {
    const firstPage = await withTimeout(
      client.getJourneys({ page: 1, pageSize: 2 })
    );

    expect(firstPage).toHaveProperty("totalJourneysCount");

    // If there are enough results for pagination, test navigation
    if (firstPage.totalJourneysCount > 2) {
      const secondPage = await withTimeout(
        client.getJourneys({ page: 2, pageSize: 2 })
      );

      // Verify different results between pages
      if (firstPage.journeys.length > 0 && secondPage.journeys.length > 0) {
        expect(firstPage.journeys[0]?.id).not.toBe(secondPage.journeys[0]?.id);
      }
    }
  });

  it("should get journeys sorted by createdAt descending", async () => {
    const result = await withTimeout(
      client.getJourneys({
        page: 1,
        pageSize: 10,
        sort: { field: "createdAt", direction: "desc" },
      })
    );

    expect(result.journeys.length).toBeGreaterThan(1);

    // Verify journeys are sorted by createdAt in descending order
    for (let i = 0; i < result.journeys.length - 1; i++) {
      expect(result.journeys[i]!.createdAt).toBeGreaterThanOrEqual(
        result.journeys[i + 1]!.createdAt
      );
    }
  });

  it("should validate journey trigger parameters", async () => {
    // Test that invalid workflow ID returns an error
    await expect(
      client.triggerJourney({ workflowId: 0, email: testUserEmail })
    ).rejects.toHaveProperty("statusCode", 400);
  });
});

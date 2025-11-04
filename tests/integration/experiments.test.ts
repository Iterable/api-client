import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import {
  cleanupTestUser,
  createTestIdentifiers,
  withTimeout,
} from "../utils/test-helpers";

describe("Experiments Integration Tests", () => {
  let client: IterableClient;
  const { testUserEmail } = createTestIdentifiers();

  beforeAll(async () => {
    client = new IterableClient();
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);
    client.destroy();
  });

  it("should get experiment metrics", async () => {
    const result = await withTimeout(client.getExperimentMetrics());

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    // API returns CSV data which is parsed into objects
  });

  it("should get experiment metrics with date range", async () => {
    const startDateTime = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString(); // 30 days ago
    const endDateTime = new Date().toISOString();

    const result = await withTimeout(
      client.getExperimentMetrics({
        startDateTime,
        endDateTime,
      })
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    // API returns CSV data which is parsed into objects
  });

  it("should handle experiment metrics with specific IDs", async () => {
    // This test may not find specific experiments, but should not error
    const result = await withTimeout(
      client.getExperimentMetrics({
        experimentId: [999999], // Non-existent ID but should still return valid response
      })
    );

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});

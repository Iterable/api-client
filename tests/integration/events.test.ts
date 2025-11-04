import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import {
  cleanupTestUser,
  createTestIdentifiers,
  generateTestEvent,
  uniqueId,
  waitForEventToAppear,
  withTimeout,
} from "../utils/test-helpers";

describe("Event Tracking Integration Tests", () => {
  let client: IterableClient;
  const { testUserEmail, testUserId } = createTestIdentifiers();

  beforeAll(async () => {
    client = new IterableClient();
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);
    client.destroy();
  });

  it("should track a custom event", async () => {
    // Ensure user exists first
    await withTimeout(
      client.updateUser({
        email: testUserEmail,
        userId: testUserId,
        dataFields: { testField: "event-test" },
      })
    );

    const timestamp = Date.now();
    const testUniqueId = uniqueId();
    const event = generateTestEvent({
      email: testUserEmail,
      eventName: "integration_test_event",
      dataFields: {
        testProperty: "integration-test-value",
        timestamp,
        uniqueId: testUniqueId,
        source: "mcp-test-suite",
      },
    });

    // Track event - success indicated by no exception
    await withTimeout(client.trackEvent(event));

    // ✅ VERIFY: Event actually appears in user's event history
    await waitForEventToAppear(
      client,
      { email: testUserEmail },
      "integration_test_event",
      {
        testProperty: "integration-test-value",
        timestamp,
        uniqueId: testUniqueId,
        source: "mcp-test-suite",
      }
    );
  });

  it("should get user events by email", async () => {
    // Track an event first
    const testId = Date.now();
    await withTimeout(
      client.trackEvent({
        email: testUserEmail,
        eventName: "get_events_by_email_test",
        dataFields: { testId },
      })
    );

    // ✅ VERIFY: Event actually appears in user's event history
    const matchingEvent = await waitForEventToAppear(
      client,
      { email: testUserEmail },
      "get_events_by_email_test",
      { testId }
    );

    expect(matchingEvent).toBeDefined();
    expect(matchingEvent.eventName).toBe("get_events_by_email_test");
    expect(matchingEvent.dataFields?.testId).toBe(testId);
  });

  it("should get user events by userId", async () => {
    // Ensure user exists with userId
    await withTimeout(
      client.updateUser({
        email: testUserEmail,
        userId: testUserId,
        dataFields: { testField: "userid-event-test" },
      })
    );

    // Track an event
    const testId = Date.now();
    await withTimeout(
      client.trackEvent({
        userId: testUserId,
        eventName: "get_events_by_userid_test",
        dataFields: { testId },
      })
    );

    // ✅ VERIFY: Event actually appears in user's event history
    const matchingEvent = await waitForEventToAppear(
      client,
      { userId: testUserId },
      "get_events_by_userid_test",
      { testId }
    );

    expect(matchingEvent).toBeDefined();
    expect(matchingEvent.eventName).toBe("get_events_by_userid_test");
    expect(matchingEvent.dataFields?.testId).toBe(testId);
  });
});

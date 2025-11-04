import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import { IterableClient } from "../../src/client";
import { TrackEventParamsSchema } from "../../src/types/events.js";
import { createMockClient, TEST_USER_EMAIL } from "../utils/test-helpers";

describe("Event Tracking", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("trackBulkEvents", () => {
    it("should track bulk events", async () => {
      const mockResponse = {
        data: {
          successCount: 2,
          failCount: 0,
          createdFields: [],
          filteredOutFields: [],
        },
      };
      const events = [
        { eventName: "event1", email: TEST_USER_EMAIL },
        { eventName: "event2", email: "test2@example.com" },
      ];
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.trackBulkEvents({ events });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/events/trackBulk",
        { events }
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.successCount).toBe(2);
      expect(result.failCount).toBe(0);
    });

    it("should handle bulk tracking failures", async () => {
      const mockResponse = {
        data: {
          successCount: 1,
          failCount: 1,
          createdFields: ["newField"],
          filteredOutFields: ["droppedField"],
          disallowedEventNames: ["bannedEvent"],
          failedUpdates: {
            invalidEmails: ["bad@email"],
          },
        },
      };
      const events = [
        { eventName: "validEvent", email: TEST_USER_EMAIL },
        { eventName: "bannedEvent", email: "bad@email" },
      ];
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.trackBulkEvents({ events });

      expect(result.successCount).toBe(1);
      expect(result.failCount).toBe(1);
      expect(result.createdFields).toContain("newField");
      expect(result.disallowedEventNames).toContain("bannedEvent");
      expect(result.failedUpdates?.invalidEmails).toContain("bad@email");
    });
  });

  describe("getUserEventsByEmail", () => {
    it("should get events by email", async () => {
      const mockResponse = { data: { events: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getUserEventsByEmail({ email: TEST_USER_EMAIL, limit: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/events/${encodeURIComponent(TEST_USER_EMAIL)}?limit=10`,
        {}
      );
    });

    it("should get events by email without limit", async () => {
      const mockResponse = { data: { events: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getUserEventsByEmail({ email: TEST_USER_EMAIL });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/events/${encodeURIComponent(TEST_USER_EMAIL)}`,
        {}
      );
    });

    it("should URL encode email addresses", async () => {
      const mockResponse = { data: { events: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getUserEventsByEmail({ email: "test+special@example.com" });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/events/${encodeURIComponent("test+special@example.com")}`,
        {}
      );
    });

    it("should return events from response", async () => {
      const mockEvents = [
        { eventName: "test_event", email: TEST_USER_EMAIL, createdAt: 1234567890 },
      ];
      const mockResponse = { data: { events: mockEvents } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getUserEventsByEmail({ email: TEST_USER_EMAIL });

      expect(result.events).toEqual(mockEvents);
    });
  });

  describe("getUserEventsByUserId", () => {
    it("should get events by userId", async () => {
      const mockResponse = { data: { events: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getUserEventsByUserId({ userId: "user123", limit: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/events/byUserId/${encodeURIComponent("user123")}?limit=10`,
        {}
      );
    });

    it("should get events by userId without limit", async () => {
      const mockResponse = { data: { events: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getUserEventsByUserId({ userId: "user123" });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/events/byUserId/${encodeURIComponent("user123")}`,
        {}
      );
    });

    it("should URL encode userId", async () => {
      const mockResponse = { data: { events: [] } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getUserEventsByUserId({ userId: "user+123" });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/api/events/byUserId/${encodeURIComponent("user+123")}`,
        {}
      );
    });

    it("should return events from response", async () => {
      const mockEvents = [
        { eventName: "test_event", userId: "user123", createdAt: 1234567890 },
      ];
      const mockResponse = { data: { events: mockEvents } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getUserEventsByUserId({ userId: "user123" });

      expect(result.events).toEqual(mockEvents);
    });
  });

  describe("Schema Validation", () => {
    it("should validate track_event parameters", () => {
      // Valid with email
      expect(() =>
        TrackEventParamsSchema.parse({
          email: "test@example.com",
          eventName: "test_event",
        })
      ).not.toThrow();

      // Valid with userId
      expect(() =>
        TrackEventParamsSchema.parse({
          userId: "123",
          eventName: "test_event",
        })
      ).not.toThrow();

      // Invalid - missing both email and userId
      expect(() =>
        TrackEventParamsSchema.parse({
          eventName: "test_event",
        })
      ).toThrow();

      // Invalid - missing eventName
      expect(() =>
        TrackEventParamsSchema.parse({
          email: "test@example.com",
        })
      ).toThrow();
    });
  });
});

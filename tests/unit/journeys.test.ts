import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import { IterableClient } from "../../src/client";
import { createMockClient } from "../utils/test-helpers";

describe("Journeys", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("getJourneys", () => {
    it("should build pagination query parameters", async () => {
      const mockResponse = {
        data: {
          journeys: [],
          totalJourneysCount: 5,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getJourneys({ page: 2, pageSize: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/journeys?page=2&pageSize=10"
      );
    });

    it("should build array query parameters for state filter", async () => {
      const mockResponse = {
        data: {
          journeys: [],
          totalJourneysCount: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getJourneys({ state: ["Archived", "Paused"] });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/journeys?page=1&pageSize=10&state=Archived&state=Paused"
      );
    });

    it("should handle no parameters with default pagination", async () => {
      const mockResponse = {
        data: {
          journeys: [],
          totalJourneysCount: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getJourneys();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/journeys?page=1&pageSize=10"
      );
    });

    it("should build combined pagination and filter parameters", async () => {
      const mockResponse = {
        data: {
          journeys: [],
          totalJourneysCount: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getJourneys({
        page: 3,
        pageSize: 25,
        state: ["Archived"],
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/journeys?page=3&pageSize=25&state=Archived"
      );
    });

    it("should return proper response structure", async () => {
      const mockJourney = {
        id: 123,
        name: "Test Journey",
        description: "Test description",
        enabled: true,
        isArchived: false,
        journeyType: "Published",
        triggerEventNames: ["testEvent"],
        createdAt: 1673633396379,
        updatedAt: 1673633396567,
        creatorUserId: "test@example.com",
      };
      const mockResponse = {
        data: {
          journeys: [mockJourney],
          totalJourneysCount: 1,
          nextPageUrl: "https://api.iterable.com/api/journeys?page=2",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getJourneys();

      expect(result).toHaveProperty("journeys");
      expect(result).toHaveProperty("totalJourneysCount");
      expect(result).toHaveProperty("nextPageUrl");
      expect(Array.isArray(result.journeys)).toBe(true);
      expect(result.journeys).toHaveLength(1);
      expect(result.journeys[0]).toEqual(mockJourney);
      expect(result.totalJourneysCount).toBe(1);
    });

    it("should handle pagination metadata properly", async () => {
      const mockResponse = {
        data: {
          journeys: [],
          totalJourneysCount: 100,
          nextPageUrl: "https://api.iterable.com/api/journeys?page=3",
          previousPageUrl: "https://api.iterable.com/api/journeys?page=1",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getJourneys({ page: 2 });

      expect(result.totalJourneysCount).toBe(100);
      expect(result.nextPageUrl).toBe(
        "https://api.iterable.com/api/journeys?page=3"
      );
      expect(result.previousPageUrl).toBe(
        "https://api.iterable.com/api/journeys?page=1"
      );
    });
  });
});

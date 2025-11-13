import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import { IterableClient } from "../../src/client";
import {
  AbortCampaignParamsSchema,
  ActivateTriggeredCampaignParamsSchema,
  ArchiveCampaignsParamsSchema,
  CampaignDetailsSchema,
  CancelCampaignParamsSchema,
  DeactivateTriggeredCampaignParamsSchema,
  GetCampaignMetricsParamsSchema,
  GetCampaignParamsSchema,
  GetCampaignsParamsSchema,
  GetChildCampaignsParamsSchema,
  SendCampaignParamsSchema,
  TriggerCampaignParamsSchema,
} from "../../src/types/campaigns.js";
import { createMockCampaign, createMockClient } from "../utils/test-helpers";

describe("Campaign Management", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("getCampaigns", () => {
    it("should call campaigns endpoint with default pagination", async () => {
      const mockResponse = {
        data: {
          campaigns: [createMockCampaign()],
          totalCampaignsCount: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getCampaigns();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns?page=1&pageSize=10",
        {
          signal: undefined,
        }
      );
    });

    it("should call campaigns endpoint with pagination parameters", async () => {
      const mockResponse = {
        data: {
          campaigns: [createMockCampaign()],
          totalCampaignsCount: 100,
          nextPageUrl: "https://api.iterable.com/api/campaigns?page=2",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getCampaigns({ page: 1, pageSize: 20 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns?page=1&pageSize=20",
        {
          signal: undefined,
        }
      );
    });

    it("should call campaigns endpoint with sorting", async () => {
      const mockResponse = {
        data: {
          campaigns: [createMockCampaign()],
          totalCampaignsCount: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getCampaigns({
        sort: { field: "createdAt", direction: "desc" },
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns?page=1&pageSize=10&sort=-createdAt",
        {
          signal: undefined,
        }
      );
    });

    it("should call campaigns endpoint with ascending sort (no prefix)", async () => {
      const mockResponse = {
        data: {
          campaigns: [createMockCampaign()],
          totalCampaignsCount: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getCampaigns({
        sort: { field: "name", direction: "asc" },
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns?page=1&pageSize=10&sort=name",
        {
          signal: undefined,
        }
      );
    });

    it("should call campaigns endpoint with all parameters", async () => {
      const mockResponse = {
        data: {
          campaigns: [createMockCampaign()],
          totalCampaignsCount: 500,
          nextPageUrl: "https://api.iterable.com/api/campaigns?page=3",
          previousPageUrl: "https://api.iterable.com/api/campaigns?page=1",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getCampaigns({
        page: 2,
        pageSize: 50,
        sort: { field: "updatedAt", direction: "desc" },
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns?page=2&pageSize=50&sort=-updatedAt",
        {
          signal: undefined,
        }
      );
    });

    it("should return campaigns array with pagination metadata", async () => {
      const mockCampaign = createMockCampaign();
      const mockResponse = {
        data: {
          campaigns: [mockCampaign],
          totalCampaignsCount: 150,
          nextPageUrl: "https://api.iterable.com/api/campaigns?page=2",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getCampaigns({ page: 1, pageSize: 1 });

      expect(result).toHaveProperty("campaigns");
      expect(result).toHaveProperty("totalCampaignsCount", 150);
      expect(result).toHaveProperty("nextPageUrl");
      expect(Array.isArray(result.campaigns)).toBe(true);
      expect(result.campaigns).toHaveLength(1);
      expect(result.campaigns[0]).toEqual(mockCampaign);
    });

    it("should handle empty campaigns response", async () => {
      const mockResponse = {
        data: { campaigns: [], totalCampaignsCount: 0 },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getCampaigns();

      expect(result).toHaveProperty("campaigns");
      expect(result).toHaveProperty("totalCampaignsCount", 0);
      expect(Array.isArray(result.campaigns)).toBe(true);
      expect(result.campaigns).toHaveLength(0);
    });
  });

  describe("getCampaign", () => {
    it("should call campaign endpoint with correct ID", async () => {
      const mockCampaign = createMockCampaign();
      const mockResponse = { data: mockCampaign };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getCampaign({ id: 12345 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns/12345",
        {
          signal: undefined,
        }
      );
    });

    it("should return single campaign with correct structure", async () => {
      const mockCampaign = createMockCampaign();
      const mockResponse = { data: mockCampaign };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getCampaign({ id: 12345 });

      expect(result).toEqual(mockCampaign);
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("type");
      expect(result).toHaveProperty("campaignState");
      expect(result).toHaveProperty("messageMedium");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
      expect(result).toHaveProperty("createdByUserId");
    });

    it("should handle abort signal", async () => {
      const mockCampaign = createMockCampaign();
      const mockResponse = { data: mockCampaign };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      const abortController = new AbortController();

      await client.getCampaign(
        { id: 12345 },
        { signal: abortController.signal }
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns/12345",
        {
          signal: abortController.signal,
        }
      );
    });
  });

  describe("getCampaignMetrics", () => {
    it("should parse CSV metrics correctly", async () => {
      const mockCsvData = "id,sent,delivered\n12345,1000,950\n12346,500,475";
      const mockResponse = { data: mockCsvData };
      const options = { campaignId: 12345, startDateTime: "2023-01-01" };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getCampaignMetrics(options);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns/metrics?campaignId=12345&startDateTime=2023-01-01",
        { responseType: "text" }
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "12345",
        sent: "1000",
        delivered: "950",
      });
      expect(result[1]).toEqual({ id: "12346", sent: "500", delivered: "475" });
    });

    it("should handle empty CSV response", async () => {
      const mockResponse = { data: "" };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getCampaignMetrics({ campaignId: 12345 });

      expect(result).toEqual([]);
    });

    it("should handle CSV with headers only", async () => {
      const mockResponse = { data: "id,sent,delivered" };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getCampaignMetrics({ campaignId: 12345 });

      expect(result).toEqual([]);
    });

    it("should build query parameters with date range", async () => {
      const mockResponse = { data: "id,sent\n123,100" };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getCampaignMetrics({
        campaignId: 12345,
        startDateTime: "2023-01-01T00:00:00Z",
        endDateTime: "2023-12-31T23:59:59Z",
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns/metrics?campaignId=12345&startDateTime=2023-01-01T00%3A00%3A00Z&endDateTime=2023-12-31T23%3A59%3A59Z",
        { responseType: "text" }
      );
    });

    it("should throw IterableResponseValidationError for invalid CSV", async () => {
      const mockResponse = { data: "invalid,csv\n\ndata" };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await expect(
        client.getCampaignMetrics({ campaignId: 12345 })
      ).rejects.toThrow("CSV parse error");
    });
  });

  describe("getChildCampaigns", () => {
    it("should call child campaigns endpoint with default pagination", async () => {
      const mockResponse = {
        data: {
          campaigns: [createMockCampaign()],
          totalCampaignsCount: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getChildCampaigns({ id: 12345 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns/recurring/12345/childCampaigns?page=1&pageSize=10",
        {
          signal: undefined,
        }
      );
    });

    it("should call child campaigns endpoint with pagination parameters", async () => {
      const mockResponse = {
        data: {
          campaigns: [createMockCampaign()],
          totalCampaignsCount: 100,
          nextPageUrl:
            "https://api.iterable.com/api/campaigns/recurring/12345/childCampaigns?page=2",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getChildCampaigns({ id: 12345, page: 1, pageSize: 20 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns/recurring/12345/childCampaigns?page=1&pageSize=20",
        {
          signal: undefined,
        }
      );
    });

    it("should call child campaigns endpoint with sorting", async () => {
      const mockResponse = {
        data: {
          campaigns: [createMockCampaign()],
          totalCampaignsCount: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getChildCampaigns({
        id: 12345,
        sort: { field: "createdAt", direction: "desc" },
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns/recurring/12345/childCampaigns?page=1&pageSize=10&sort=-createdAt",
        {
          signal: undefined,
        }
      );
    });

    it("should call child campaigns endpoint with all parameters", async () => {
      const mockResponse = {
        data: {
          campaigns: [createMockCampaign()],
          totalCampaignsCount: 500,
          nextPageUrl:
            "https://api.iterable.com/api/campaigns/recurring/12345/childCampaigns?page=3",
          previousPageUrl:
            "https://api.iterable.com/api/campaigns/recurring/12345/childCampaigns?page=1",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getChildCampaigns({
        id: 12345,
        page: 2,
        pageSize: 50,
        sort: { field: "updatedAt", direction: "desc" },
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns/recurring/12345/childCampaigns?page=2&pageSize=50&sort=-updatedAt",
        {
          signal: undefined,
        }
      );
    });

    it("should return campaigns array with pagination metadata", async () => {
      const mockCampaign = createMockCampaign();
      const mockResponse = {
        data: {
          campaigns: [mockCampaign],
          totalCampaignsCount: 150,
          nextPageUrl:
            "https://api.iterable.com/api/campaigns/recurring/12345/childCampaigns?page=2",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getChildCampaigns({
        id: 12345,
        page: 1,
        pageSize: 1,
      });

      expect(result).toHaveProperty("campaigns");
      expect(result).toHaveProperty("totalCampaignsCount", 150);
      expect(result).toHaveProperty("nextPageUrl");
      expect(Array.isArray(result.campaigns)).toBe(true);
      expect(result.campaigns).toHaveLength(1);
      expect(result.campaigns[0]).toEqual(mockCampaign);
    });

    it("should handle empty child campaigns response", async () => {
      const mockResponse = {
        data: { campaigns: [], totalCampaignsCount: 0 },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getChildCampaigns({ id: 12345 });

      expect(result).toHaveProperty("campaigns");
      expect(result).toHaveProperty("totalCampaignsCount", 0);
      expect(Array.isArray(result.campaigns)).toBe(true);
      expect(result.campaigns).toHaveLength(0);
    });

    it("should handle abort signal", async () => {
      const mockResponse = {
        data: {
          campaigns: [createMockCampaign()],
          totalCampaignsCount: 1,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      const abortController = new AbortController();

      await client.getChildCampaigns(
        { id: 12345 },
        { signal: abortController.signal }
      );

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/campaigns/recurring/12345/childCampaigns?page=1&pageSize=10",
        {
          signal: abortController.signal,
        }
      );
    });
  });

  describe("Schema Validation", () => {
    it("should validate get_campaigns parameters", () => {
      // Valid parameters - all optional
      expect(() => GetCampaignsParamsSchema.parse({})).not.toThrow();

      expect(() =>
        GetCampaignsParamsSchema.parse({
          page: 1,
          pageSize: 20,
        })
      ).not.toThrow();

      expect(() =>
        GetCampaignsParamsSchema.parse({
          sort: { field: "createdAt", direction: "desc" },
        })
      ).not.toThrow();

      expect(() =>
        GetCampaignsParamsSchema.parse({
          page: 2,
          pageSize: 50,
          sort: { field: "name", direction: "asc" },
        })
      ).not.toThrow();

      // Invalid parameters
      expect(() => GetCampaignsParamsSchema.parse({ page: 0 })).toThrow(); // page must be >= 1

      expect(() => GetCampaignsParamsSchema.parse({ pageSize: 0 })).toThrow(); // pageSize must be >= 1

      expect(() =>
        GetCampaignsParamsSchema.parse({ pageSize: 2000 })
      ).toThrow(); // pageSize must be <= 1000

      expect(() =>
        GetCampaignsParamsSchema.parse({
          sort: { field: "invalidField", direction: "asc" },
        })
      ).toThrow(); // invalid sort field

      expect(() =>
        GetCampaignsParamsSchema.parse({
          sort: { field: "id", direction: "invalid" },
        })
      ).toThrow(); // invalid sort direction
    });

    it("should validate get_campaign_metrics parameters", () => {
      // Valid parameters
      expect(() =>
        GetCampaignMetricsParamsSchema.parse({
          campaignId: 12345,
          startDateTime: new Date("2023-01-01T00:00:00Z"),
          endDateTime: new Date("2023-12-31T23:59:59Z"),
        })
      ).not.toThrow();

      // Missing required campaignId
      expect(() =>
        GetCampaignMetricsParamsSchema.parse({
          startDateTime: new Date("2023-01-01T00:00:00Z"),
        })
      ).toThrow();
    });

    it("should validate get_campaign parameters", () => {
      // Valid parameters
      expect(() => GetCampaignParamsSchema.parse({ id: 12345 })).not.toThrow();

      // Invalid parameters
      expect(() => GetCampaignParamsSchema.parse({ id: "invalid" })).toThrow();

      expect(() => GetCampaignParamsSchema.parse({})).toThrow();
    });

    it("should validate get_child_campaigns parameters", () => {
      // Valid parameters - id is required, pagination is optional
      expect(() =>
        GetChildCampaignsParamsSchema.parse({ id: 12345 })
      ).not.toThrow();

      expect(() =>
        GetChildCampaignsParamsSchema.parse({
          id: 12345,
          page: 1,
          pageSize: 20,
        })
      ).not.toThrow();

      expect(() =>
        GetChildCampaignsParamsSchema.parse({
          id: 12345,
          sort: { field: "createdAt", direction: "desc" },
        })
      ).not.toThrow();

      expect(() =>
        GetChildCampaignsParamsSchema.parse({
          id: 12345,
          page: 2,
          pageSize: 50,
          sort: { field: "name", direction: "asc" },
        })
      ).not.toThrow();

      // Invalid parameters
      expect(() => GetChildCampaignsParamsSchema.parse({})).toThrow(); // missing id

      expect(() =>
        GetChildCampaignsParamsSchema.parse({ id: 12345, page: 0 })
      ).toThrow(); // page must be >= 1

      expect(() =>
        GetChildCampaignsParamsSchema.parse({ id: 12345, pageSize: 0 })
      ).toThrow(); // pageSize must be >= 1

      expect(() =>
        GetChildCampaignsParamsSchema.parse({ id: 12345, pageSize: 2000 })
      ).toThrow(); // pageSize must be <= 1000

      expect(() =>
        GetChildCampaignsParamsSchema.parse({
          id: 12345,
          sort: { field: "invalidField", direction: "asc" },
        })
      ).toThrow(); // invalid sort field

      expect(() =>
        GetChildCampaignsParamsSchema.parse({
          id: 12345,
          sort: { field: "id", direction: "invalid" },
        })
      ).toThrow(); // invalid sort direction
    });

    it("should validate campaign schema with new structure", () => {
      const validCampaign = createMockCampaign();

      // Valid campaign
      expect(() => CampaignDetailsSchema.parse(validCampaign)).not.toThrow();

      // Test required fields
      expect(() =>
        CampaignDetailsSchema.parse({ ...validCampaign, id: undefined })
      ).toThrow();

      expect(() =>
        CampaignDetailsSchema.parse({ ...validCampaign, name: undefined })
      ).toThrow();

      expect(() =>
        CampaignDetailsSchema.parse({ ...validCampaign, type: undefined })
      ).toThrow();

      expect(() =>
        CampaignDetailsSchema.parse({
          ...validCampaign,
          campaignState: undefined,
        })
      ).toThrow();

      expect(() =>
        CampaignDetailsSchema.parse({
          ...validCampaign,
          messageMedium: undefined,
        })
      ).toThrow();

      expect(() =>
        CampaignDetailsSchema.parse({
          ...validCampaign,
          createdByUserId: undefined,
        })
      ).toThrow();

      // Test enum values
      expect(() =>
        CampaignDetailsSchema.parse({ ...validCampaign, type: "InvalidType" })
      ).toThrow();

      expect(() =>
        CampaignDetailsSchema.parse({
          ...validCampaign,
          campaignState: "InvalidState",
        })
      ).toThrow();

      // Valid enum values should work
      expect(() =>
        CampaignDetailsSchema.parse({ ...validCampaign, type: "Triggered" })
      ).not.toThrow();

      expect(() =>
        CampaignDetailsSchema.parse({
          ...validCampaign,
          campaignState: "Running",
        })
      ).not.toThrow();
    });

    it("should validate abort_campaign parameters", () => {
      // Valid parameters
      expect(() =>
        AbortCampaignParamsSchema.parse({ campaignId: 12345 })
      ).not.toThrow();

      // Invalid parameters
      expect(() => AbortCampaignParamsSchema.parse({})).toThrow(); // missing campaignId
      expect(() =>
        AbortCampaignParamsSchema.parse({ campaignId: "invalid" })
      ).toThrow(); // invalid type
    });

    it("should validate cancel_campaign parameters", () => {
      // Valid parameters
      expect(() =>
        CancelCampaignParamsSchema.parse({ campaignId: 12345 })
      ).not.toThrow();

      // Invalid parameters
      expect(() => CancelCampaignParamsSchema.parse({})).toThrow(); // missing campaignId
      expect(() =>
        CancelCampaignParamsSchema.parse({ campaignId: "invalid" })
      ).toThrow(); // invalid type
    });

    it("should validate activate_triggered_campaign parameters", () => {
      // Valid parameters
      expect(() =>
        ActivateTriggeredCampaignParamsSchema.parse({ campaignId: 12345 })
      ).not.toThrow();

      // Invalid parameters
      expect(() => ActivateTriggeredCampaignParamsSchema.parse({})).toThrow(); // missing campaignId
      expect(() =>
        ActivateTriggeredCampaignParamsSchema.parse({ campaignId: "invalid" })
      ).toThrow(); // invalid type
    });

    it("should validate deactivate_triggered_campaign parameters", () => {
      // Valid parameters
      expect(() =>
        DeactivateTriggeredCampaignParamsSchema.parse({ campaignId: 12345 })
      ).not.toThrow();

      // Invalid parameters
      expect(() => DeactivateTriggeredCampaignParamsSchema.parse({})).toThrow(); // missing campaignId
      expect(() =>
        DeactivateTriggeredCampaignParamsSchema.parse({ campaignId: "invalid" })
      ).toThrow(); // invalid type
    });

    it("should validate archive_campaigns parameters", () => {
      // Valid parameters
      expect(() =>
        ArchiveCampaignsParamsSchema.parse({ campaignIds: [12345] })
      ).not.toThrow();

      expect(() =>
        ArchiveCampaignsParamsSchema.parse({ campaignIds: [12345, 67890] })
      ).not.toThrow();

      // Invalid parameters
      expect(() => ArchiveCampaignsParamsSchema.parse({})).toThrow(); // missing campaignIds
      expect(() =>
        ArchiveCampaignsParamsSchema.parse({ campaignIds: [] })
      ).toThrow(); // empty array
      expect(() =>
        ArchiveCampaignsParamsSchema.parse({ campaignIds: ["invalid"] })
      ).toThrow(); // invalid type
    });

    it("should validate trigger_campaign parameters", () => {
      // Valid parameters - required fields only
      expect(() =>
        TriggerCampaignParamsSchema.parse({
          campaignId: 12345,
          listIds: [100],
        })
      ).not.toThrow();

      // Valid parameters - all fields
      expect(() =>
        TriggerCampaignParamsSchema.parse({
          campaignId: 12345,
          listIds: [100, 200],
          dataFields: { key: "value" },
          suppressionListIds: [300],
          allowRepeatMarketingSends: true,
        })
      ).not.toThrow();

      // Invalid parameters
      expect(() => TriggerCampaignParamsSchema.parse({})).toThrow(); // missing required fields
      expect(() =>
        TriggerCampaignParamsSchema.parse({ campaignId: 12345 })
      ).toThrow(); // missing listIds
      expect(() =>
        TriggerCampaignParamsSchema.parse({
          campaignId: 12345,
          listIds: [],
        })
      ).toThrow(); // empty listIds
      expect(() =>
        TriggerCampaignParamsSchema.parse({
          campaignId: "invalid",
          listIds: [100],
        })
      ).toThrow(); // invalid campaignId type
    });

    it("should validate send_campaign parameters", () => {
      // Valid parameters
      expect(() =>
        SendCampaignParamsSchema.parse({ campaignId: 12345 })
      ).not.toThrow();

      // Invalid parameters
      expect(() => SendCampaignParamsSchema.parse({})).toThrow(); // missing campaignId
      expect(() =>
        SendCampaignParamsSchema.parse({ campaignId: "invalid" })
      ).toThrow(); // invalid type
    });
  });
});

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

describe("Experiment Operations", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("getExperimentMetrics", () => {
    it("should get experiment metrics with no parameters", async () => {
      const mockResponse = {
        data: "experimentId,campaignId,opens,clicks,conversions\n123,456,100,25,5\n124,456,90,20,3",
      };
      const expectedParsedData = [
        {
          experimentId: "123",
          campaignId: "456",
          opens: "100",
          clicks: "25",
          conversions: "5",
        },
        {
          experimentId: "124",
          campaignId: "456",
          opens: "90",
          clicks: "20",
          conversions: "3",
        },
      ];

      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      // Mock the parseCsv method
      jest.spyOn(client as any, "parseCsv").mockReturnValue(expectedParsedData);

      const result = await client.getExperimentMetrics();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments/metrics",
        { responseType: "text" }
      );
      expect(result).toEqual(expectedParsedData);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get experiment metrics with experiment IDs", async () => {
      const mockResponse = {
        data: "experimentId,campaignId,opens,clicks,conversions\n123,456,100,25,5\n125,457,80,15,2",
      };
      const expectedParsedData = [
        {
          experimentId: "123",
          campaignId: "456",
          opens: "100",
          clicks: "25",
          conversions: "5",
        },
        {
          experimentId: "125",
          campaignId: "457",
          opens: "80",
          clicks: "15",
          conversions: "2",
        },
      ];

      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      jest.spyOn(client as any, "parseCsv").mockReturnValue(expectedParsedData);

      const result = await client.getExperimentMetrics({
        experimentId: [123, 125],
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments/metrics?experimentId=123&experimentId=125",
        { responseType: "text" }
      );
      expect(result).toEqual(expectedParsedData);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get experiment metrics with campaign IDs", async () => {
      const mockResponse = {
        data: "experimentId,campaignId,opens,clicks,conversions\n123,456,100,25,5",
      };
      const expectedParsedData = [
        {
          experimentId: "123",
          campaignId: "456",
          opens: "100",
          clicks: "25",
          conversions: "5",
        },
      ];

      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      jest.spyOn(client as any, "parseCsv").mockReturnValue(expectedParsedData);

      const result = await client.getExperimentMetrics({
        campaignId: [456],
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments/metrics?campaignId=456",
        { responseType: "text" }
      );
      expect(result).toEqual(expectedParsedData);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get experiment metrics with date range", async () => {
      const mockResponse = {
        data: "experimentId,campaignId,opens,clicks,conversions\n123,456,50,12,2",
      };
      const expectedParsedData = [
        {
          experimentId: "123",
          campaignId: "456",
          opens: "50",
          clicks: "12",
          conversions: "2",
        },
      ];

      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      jest.spyOn(client as any, "parseCsv").mockReturnValue(expectedParsedData);

      const result = await client.getExperimentMetrics({
        startDateTime: "2024-01-01T00:00:00Z",
        endDateTime: "2024-01-31T23:59:59Z",
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments/metrics?startDateTime=2024-01-01T00%3A00%3A00Z&endDateTime=2024-01-31T23%3A59%3A59Z",
        { responseType: "text" }
      );
      expect(result).toEqual(expectedParsedData);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should get experiment metrics with all parameters", async () => {
      const mockResponse = {
        data: "experimentId,campaignId,opens,clicks,conversions\n123,456,75,18,4\n124,457,65,14,3",
      };
      const expectedParsedData = [
        {
          experimentId: "123",
          campaignId: "456",
          opens: "75",
          clicks: "18",
          conversions: "4",
        },
        {
          experimentId: "124",
          campaignId: "457",
          opens: "65",
          clicks: "14",
          conversions: "3",
        },
      ];

      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      jest.spyOn(client as any, "parseCsv").mockReturnValue(expectedParsedData);

      const result = await client.getExperimentMetrics({
        experimentId: [123, 124],
        campaignId: [456, 457],
        startDateTime: "2024-01-01T00:00:00Z",
        endDateTime: "2024-01-31T23:59:59Z",
      });

      const actualCall = mockAxiosInstance.get.mock.calls[0][0];
      expect(actualCall).toContain("experimentId=123");
      expect(actualCall).toContain("experimentId=124");
      expect(actualCall).toContain("campaignId=456");
      expect(actualCall).toContain("campaignId=457");
      expect(actualCall).toContain("startDateTime=2024-01-01T00%3A00%3A00Z");
      expect(actualCall).toContain("endDateTime=2024-01-31T23%3A59%3A59Z");
      expect(actualCall.startsWith("/api/experiments/metrics?")).toBe(true);
      expect(result).toEqual(expectedParsedData);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle empty arrays", async () => {
      const mockResponse = {
        data: "experimentId,campaignId,opens,clicks,conversions",
      };
      const expectedParsedData: any[] = [];

      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      jest.spyOn(client as any, "parseCsv").mockReturnValue(expectedParsedData);

      const result = await client.getExperimentMetrics({
        experimentId: [],
        campaignId: [],
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments/metrics",
        { responseType: "text" }
      );
      expect(result).toEqual(expectedParsedData);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

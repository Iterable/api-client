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

    it("should throw IterableResponseValidationError for invalid CSV", async () => {
      const mockResponse = { data: "invalid,csv\n\ndata" };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await expect(client.getExperimentMetrics()).rejects.toThrow(
        "CSV parse error"
      );
    });
  });

  describe("listExperiments", () => {
    it("should list experiments with no parameters", async () => {
      const mockResponse = {
        data: {
          experiments: [
            {
              id: 1,
              name: "Test Experiment 1",
              status: "running",
              startDate: "2024-01-01T00:00:00Z",
              channelType: "email",
              author: "test@example.com",
            },
          ],
          totalCount: 1,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.listExperiments();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/experiments");
      expect(result.experiments).toHaveLength(1);
      expect(result.experiments[0]?.id).toBe(1);
    });

    it("should list experiments with campaign filter", async () => {
      const mockResponse = {
        data: {
          experiments: [
            {
              id: 2,
              name: "Campaign Experiment",
              status: "draft",
              channelType: "email",
              author: "test@example.com",
            },
          ],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.listExperiments({ campaignId: 456 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments?campaignId=456"
      );
    });

    it("should list experiments with status filter", async () => {
      const mockResponse = {
        data: {
          experiments: [],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.listExperiments({ status: "running" });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments?state=running"
      );
    });

    it("should list experiments with date filters", async () => {
      const mockResponse = {
        data: {
          experiments: [],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.listExperiments({
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-31T23:59:59Z",
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments?startDateTime=2024-01-01T00%3A00%3A00Z&endDateTime=2024-01-31T23%3A59%3A59Z"
      );
    });

    it("should list experiments with pagination", async () => {
      const mockResponse = {
        data: {
          experiments: [],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.listExperiments({ limit: 50, offset: 100 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments?limit=50&offset=100"
      );
    });

    it("should list experiments with all parameters", async () => {
      const mockResponse = {
        data: {
          experiments: [],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.listExperiments({
        campaignId: 123,
        status: "finished",
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-31T23:59:59Z",
        limit: 10,
        offset: 20,
      });

      const actualCall = mockAxiosInstance.get.mock.calls[0][0];
      expect(actualCall).toContain("campaignId=123");
      expect(actualCall).toContain("state=finished");
      expect(actualCall).toContain("startDateTime=2024-01-01T00%3A00%3A00Z");
      expect(actualCall).toContain("endDateTime=2024-01-31T23%3A59%3A59Z");
      expect(actualCall).toContain("limit=10");
      expect(actualCall).toContain("offset=20");
    });
  });

  describe("getExperiment", () => {
    it("should get experiment details by ID", async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          id: 123,
          status: "running",
          channelType: "email",
          experimentType: "SubjectLine",
          allocationMode: "even_split",
          sizing: {
            holdoutPercentage: null,
            perVariantPercentage: 50,
            testGroupPercentage: null,
            winnerGroupPercentage: null,
            testDurationMinutes: null,
            sendsPerVariant: null,
            attributionPeriodHours: null,
          },
          creationDate: null,
          startDate: null,
          finishDate: null,
          constraints: null,
          meta: {
            name: "Test Experiment",
            conversionMetrics: ["opens"],
            campaignId: 456,
            projectId: 1,
            orgId: 2,
          },
          variants: [
            {
              id: 1,
              name: "Control",
              value: { templateId: 10 },
              currentPercentage: 50,
              isWinner: false,
              isControl: true,
            },
            {
              id: 2,
              name: "Variant A",
              value: { templateId: 11 },
              currentPercentage: 50,
              isWinner: false,
              isControl: false,
            },
          ],
        },
      });

      const result = await client.getExperiment({ experimentId: 123 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments/123"
      );
      expect(result.id).toBe(123);
      expect(result.name).toBe("Test Experiment");
      expect(result.campaignId).toBe(456);
      expect(result.meta.name).toBe("Test Experiment");
      expect(result.allocationMode).toBe("even_split");
      expect(result.variants).toHaveLength(2);
      expect(result.variants[0]?.percentage).toBe(50);
      expect(result.variants[0]?.currentPercentage).toBe(50);
    });

    it("should handle 404 error for non-existent experiment", async () => {
      const error = new Error("Request failed with status code 404");
      (error as any).response = { status: 404 };
      (error as any).isAxiosError = true;
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(
        client.getExperiment({ experimentId: 999 })
      ).rejects.toThrow();
    });
  });

  describe("getExperimentVariants", () => {
    it("should get experiment variants", async () => {
      const mockResponse = {
        data: {
          experimentId: 123,
          variants: [
            {
              variantId: 0,
              name: "Control",
              value: { templateId: 84 },
              currentPercentage: 50,
              content: {
                subject: "Control Subject",
                preheader: "Control Preheader",
                htmlSource: "<html>Control</html>",
                plainText: "Control",
              },
            },
            {
              variantId: 1,
              name: "Variant A",
              value: { templateId: 85 },
              currentPercentage: 50,
              content: {
                subject: "Variant A Subject",
                preheader: "Variant A Preheader",
                htmlSource: "<html>Variant A</html>",
                plainText: "Variant A",
              },
            },
          ],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getExperimentVariants({ experimentId: 123 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments/123/variants"
      );
      expect(result.experimentId).toBe(123);
      expect(result.variants).toHaveLength(2);
      expect(result.variants[0]?.variantId).toBe(0);
      expect(result.variants[0]?.id).toBe(0);
      expect(result.variants[0]?.currentPercentage).toBe(50);
      expect(result.variants[0]?.percentage).toBe(50);
      expect(result.variants[0]?.content?.subject).toBe("Control Subject");
      expect(result.variants[1]?.content?.subject).toBe("Variant A Subject");
    });

    it("should handle 404 error for non-existent experiment variants", async () => {
      const error = new Error("Request failed with status code 404");
      (error as any).response = { status: 404 };
      (error as any).isAxiosError = true;
      mockAxiosInstance.get.mockRejectedValue(error);

      await expect(
        client.getExperimentVariants({ experimentId: 999 })
      ).rejects.toThrow();
    });

    it("should handle experiments with optional fields", async () => {
      const mockResponse = {
        data: {
          experimentId: 123,
          variants: [
            {
              variantId: 0,
              name: "Control",
              value: { templateId: 84 },
              currentPercentage: 100,
              content: null,
            },
          ],
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getExperimentVariants({ experimentId: 123 });

      expect(result.variants).toHaveLength(1);
      expect(result.variants[0]?.id).toBe(0);
      expect(result.variants[0]?.percentage).toBe(100);
      expect(result.variants[0]?.content).toBeNull();
    });
  });

  describe("experiment write and metrics routes", () => {
    const experiment = {
      id: 884102,
      status: "draft",
      channelType: "email",
      experimentType: "SubjectLine",
      allocationMode: "even_split",
      sizing: {
        holdoutPercentage: null,
        perVariantPercentage: null,
        testGroupPercentage: null,
        winnerGroupPercentage: null,
        testDurationMinutes: null,
        sendsPerVariant: null,
        attributionPeriodHours: null,
      },
      creationDate: null,
      startDate: null,
      finishDate: null,
      constraints: null,
      meta: {
        name: "Welcome Experiment",
        conversionMetrics: ["opens"],
        campaignId: 129500,
        projectId: 1,
        orgId: 2,
      },
      variants: [
        {
          id: 0,
          name: "Control",
          value: { templateId: 55 },
          currentPercentage: 50,
          isWinner: false,
          isControl: true,
        },
      ],
    };

    it("gets lifetime totals", async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          id: 884102,
          status: "running",
          lift: 0.2,
          variants: [
            {
              id: 0,
              name: "Control",
              isControl: true,
              isWinner: false,
              confidence: 0.9,
              metrics: { sends: 5000, emailOpen: 1250, purchase: 50 },
            },
          ],
        },
      });

      const result = await client.getExperimentTotals({ experimentId: 884102 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments/884102/totals"
      );
      expect(result).toEqual({
        id: 884102,
        status: "running",
        variants: [
          {
            id: 0,
            name: "Control",
            isControl: true,
            isWinner: false,
            metrics: { sends: 5000, emailOpen: 1250, purchase: 50 },
          },
        ],
      });
      expect(result).not.toHaveProperty("lift");
      expect(result.variants[0]).not.toHaveProperty("confidence");
    });

    it("gets trends for an explicit date window", async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          id: 884102,
          status: "running",
          interval: "day",
          startDateTime: "2024-01-01T00:00:00.000Z",
          endDateTime: "2024-01-07T00:00:00.000Z",
          variants: [
            {
              id: 0,
              name: "Control",
              isControl: true,
              isWinner: false,
              series: {
                TotalEmailSend: [
                  { time: "2024-01-01T00:00:00.000Z", value: 10 },
                ],
              },
            },
          ],
          holdout: null,
        },
      });

      await client.getExperimentTrends({
        experimentId: 884102,
        startDateTime: "2024-01-01T00:00:00.000Z",
        endDateTime: "2024-01-07T00:00:00.000Z",
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments/884102/trends?startDateTime=2024-01-01T00%3A00%3A00.000Z&endDateTime=2024-01-07T00%3A00%3A00.000Z"
      );
    });

    it("gets trends for the default run window", async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          id: 884102,
          status: "running",
          interval: "day",
          startDateTime: "2024-01-01T00:00:00.000Z",
          endDateTime: "2024-01-07T00:00:00.000Z",
          variants: [],
        },
      });

      await client.getExperimentTrends({ experimentId: 884102 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/experiments/884102/trends"
      );
    });

    it("accepts epoch millisecond timestamps on the experiment body", async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          ...experiment,
          status: "finished",
          creationDate: 1790263999585,
          startDate: 1790264000000,
          finishDate: 1790265000000,
        },
      });

      const result = await client.cancelExperiment({ experimentId: 884102 });

      expect(result.creationDate).toBe(1790263999585);
      expect(result.startDate).toBe(1790264000000);
      expect(result.finishDate).toBe(1790265000000);
    });

    it("creates a draft and omits an absent name", async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: experiment });

      const result = await client.createExperiment({
        campaignId: 129500,
        experimentType: "SubjectLine",
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/api/experiments", {
        campaignId: 129500,
        experimentType: "SubjectLine",
      });
      expect(result.id).toBe(884102);
      expect(result.sizing.holdoutPercentage).toBeNull();
      expect(result.constraints).toBeNull();
    });

    it("copies a template into a new variant", async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: experiment });

      await client.copyExperimentVariant({
        experimentId: 884102,
        copyFromTemplateId: 55,
        name: "Variant A",
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/experiments/884102/variants",
        { copyFromTemplateId: 55, name: "Variant A" }
      );
    });

    it("patches settings and sends null without omitted fields", async () => {
      mockAxiosInstance.patch.mockResolvedValue({ data: experiment });

      await client.updateExperimentSettings({
        experimentId: 884102,
        holdoutSettings: null,
      });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/api/experiments/884102/settings",
        { holdoutSettings: null }
      );
    });

    it.each([
      ["startExperiment", "/api/experiments/884102/start"],
      ["cancelExperiment", "/api/experiments/884102/cancel"],
      ["deleteExperiment", "/api/experiments/884102/delete"],
    ] as const)("%s posts an empty body", async (method, url) => {
      mockAxiosInstance.post.mockResolvedValue({ data: experiment });

      await client[method]({ experimentId: 884102 });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(url, {});
    });

    it("declares a winner", async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: experiment });

      await client.declareExperimentWinner({
        experimentId: 884102,
        variantId: 2,
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/experiments/884102/winner",
        { variantId: 2 }
      );
    });
  });
});

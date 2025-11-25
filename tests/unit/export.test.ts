import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import { IterableClient } from "../../src/client";
import type { StartExportJobParams } from "../../src/types/export.js";
import { createMockClient } from "../utils/test-helpers";

describe("Export Operations", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getExportJobs", () => {
    it("should get export jobs list", async () => {
      const mockResponse = {
        data: {
          jobs: [
            {
              id: 123,
              dataTypeName: "user",
              jobState: "completed",
              bytesExported: 1024,
            },
            {
              id: 124,
              dataTypeName: "emailSend",
              jobState: "running",
            },
          ],
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getExportJobs();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/export/jobs?");
      expect(result).toEqual(mockResponse.data);
    });

    it("should get export jobs filtered by state", async () => {
      const mockResponse = {
        data: {
          jobs: [
            {
              id: 125,
              dataTypeName: "purchase",
              jobState: "running",
            },
          ],
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getExportJobs({ jobState: "running" });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/export/jobs?jobState=running"
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("getExportFiles", () => {
    it("should get export files for a job", async () => {
      const mockResponse = {
        data: {
          exportTruncated: false,
          files: [
            {
              file: "export_123_part_1.csv",
              url: "https://example.com/file1.csv",
            },
            {
              file: "export_123_part_2.csv",
              url: "https://example.com/file2.csv",
            },
          ],
          jobId: 123,
          jobState: "completed",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getExportFiles({ jobId: 123 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/export/123/files?"
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should get export files with pagination", async () => {
      const mockResponse = {
        data: {
          exportTruncated: false,
          files: [
            {
              file: "export_456_part_3.csv",
              url: "https://example.com/file3.csv",
            },
          ],
          jobId: 456,
          jobState: "running",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getExportFiles({
        jobId: 456,
        startAfter: "export_456_part_2.csv",
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/export/456/files?startAfter=export_456_part_2.csv"
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("startExportJob", () => {
    it("should start an export job with required parameters", async () => {
      const mockResponse = {
        data: {
          jobId: 789,
          message: "Export job started successfully",
        },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const params: StartExportJobParams = {
        dataTypeName: "user",
        outputFormat: "text/csv",
      };
      const result = await client.startExportJob(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/api/export/start", {
        dataTypeName: "user",
        outputFormat: "text/csv",
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should start an export job with all parameters", async () => {
      const mockResponse = {
        data: {
          jobId: 890,
          message: "Export job started successfully",
        },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const startDateTime = new Date("2024-01-01T00:00:00Z").toISOString();
      const endDateTime = new Date("2024-01-31T23:59:59Z").toISOString();
      const params: StartExportJobParams = {
        dataTypeName: "emailSend",
        outputFormat: "application/x-json-stream",
        startDateTime,
        endDateTime,
        campaignId: 12345,
        delimiter: ",",
        omitFields: "internalId,metadata",
        onlyFields: "email,firstName,lastName",
      };
      const result = await client.startExportJob(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith("/api/export/start", {
        dataTypeName: "emailSend",
        outputFormat: "application/x-json-stream",
        startDateTime,
        endDateTime,
        campaignId: 12345,
        delimiter: ",",
        omitFields: "internalId,metadata",
        onlyFields: "email,firstName,lastName",
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("cancelExportJob", () => {
    it("should cancel an export job", async () => {
      const mockResponse = {
        data: {
          message: "Export job cancelled successfully",
        },
      };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await client.cancelExportJob({ jobId: 999 });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith("/api/export/999");
      expect(result).toEqual(mockResponse.data);
    });
  });
});

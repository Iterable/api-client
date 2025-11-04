import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import { cleanupTestUser, createTestIdentifiers } from "../utils/test-helpers";

describe("Export Operations Integration Tests", () => {
  let client: IterableClient;

  const { testUserEmail } = createTestIdentifiers();

  beforeAll(async () => {
    client = new IterableClient();
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);
    client.destroy();
  });

  describe("Export Job Lifecycle", () => {
    let testJobId: number | null = null;

    afterEach(async () => {
      // Clean up any test jobs
      if (testJobId) {
        try {
          await client.cancelExportJob({ jobId: testJobId });
        } catch {
          // Job may have already completed or been cancelled
        }
        testJobId = null;
      }
    });

    it("should start an export job and verify it appears in jobs list", async () => {
      // Start a small export job
      const startResult = await client.startExportJob({
        dataTypeName: "user",
        outputFormat: "text/csv",
        startDateTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDateTime: new Date().toISOString(),
      });

      expect(startResult).toBeDefined();
      expect(startResult.jobId).toBeDefined();
      expect(typeof startResult.jobId).toBe("number");

      testJobId = startResult.jobId;

      // The job should appear immediately in the jobs list
      const jobsResult = await client.getExportJobs();
      expect(jobsResult).toBeDefined();
      expect(jobsResult.jobs).toBeDefined();
      expect(Array.isArray(jobsResult.jobs)).toBe(true);

      // Find our job in the list (using correct field names)
      const ourJob = jobsResult.jobs.find((job: any) => job.id === testJobId);
      expect(ourJob).toBeDefined();

      if (ourJob) {
        expect(ourJob.dataTypeName).toBe("user");
        expect(
          ["enqueued", "queued", "running", "completed"].includes(
            ourJob.jobState?.toLowerCase()
          )
        ).toBe(true);
      }
    }, 10000); // 10 second timeout

    it("should get export jobs with state filtering", async () => {
      const result = await client.getExportJobs({ jobState: "completed" });

      expect(result).toBeDefined();
      expect(result.jobs).toBeDefined();
      expect(Array.isArray(result.jobs)).toBe(true);

      // All returned jobs should be completed
      result.jobs.forEach((job: any) => {
        expect(job.jobState?.toLowerCase()).toBe("completed");
      });
    });

    it("should handle export job files for completed jobs", async () => {
      // First get completed jobs
      const jobsResult = await client.getExportJobs({
        jobState: "completed",
      });

      expect(jobsResult).toBeDefined();
      expect(jobsResult.jobs).toBeDefined();

      if (jobsResult.jobs.length > 0) {
        const completedJob = jobsResult.jobs[0]!;
        expect(completedJob).toBeDefined();
        expect(completedJob.id).toBeDefined();

        // Try to get files for this completed job
        const filesResult = await client.getExportFiles({
          jobId: completedJob.id,
        });

        expect(filesResult).toBeDefined();
        expect(filesResult.jobId).toBe(completedJob.id);
        expect(filesResult.jobState).toBeDefined();
        expect(filesResult.files).toBeDefined();
        expect(Array.isArray(filesResult.files)).toBe(true);
      }
    });

    it("should cancel a running export job", async () => {
      // Start a job to cancel
      const startResult = await client.startExportJob({
        dataTypeName: "emailSend",
        outputFormat: "text/csv",
        startDateTime: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        endDateTime: new Date().toISOString(),
      });

      expect(startResult).toBeDefined();
      expect(startResult.jobId).toBeDefined();
      testJobId = startResult.jobId;

      // Cancel the job
      const cancelResult = await client.cancelExportJob({
        jobId: testJobId,
      });

      expect(cancelResult).toBeDefined();
      // The cancel response structure may vary, just verify it doesn't error

      testJobId = null; // Don't try to cancel again in afterEach
    });

    it("should handle date range filtering", async () => {
      const response = await client.startExportJob({
        dataTypeName: "user",
        outputFormat: "text/csv",
        startDateTime: "2024-12-01 00:00:00",
        endDateTime: "2024-12-01 23:59:59",
      });

      expect(response).toHaveProperty("jobId");
      await client.cancelExportJob({ jobId: response.jobId });
    });
  });
});

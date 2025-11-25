import { z } from "zod";

import { IterableDateTimeSchema } from "./common.js";

/**
 * Export operation schemas and types
 */

export const GetExportJobsParamsSchema = z.object({
  jobState: z
    .string()
    .optional()
    .describe(
      "Filter results to only include jobs in the specified state (enqueued, queued, running, completed, failed, cancelled, cancelling)"
    ),
});

export const GetExportFilesParamsSchema = z.object({
  jobId: z
    .number()
    .describe("The ID of the export job (returned from startExportJob)"),
  startAfter: z
    .string()
    .optional()
    .describe(
      "Skip file names up to and including this value. Use for paginating over the files in the export (e.g., 'file-1679086247925.csv')"
    ),
});

export const StartExportJobParamsSchema = z.object({
  dataTypeName: z
    .enum([
      "emailSend",
      "emailOpen",
      "emailClick",
      "hostedUnsubscribeClick",
      "emailComplaint",
      "emailBounce",
      "emailSendSkip",
      "pushSend",
      "pushOpen",
      "pushUninstall",
      "pushBounce",
      "pushSendSkip",
      "inAppSend",
      "inAppOpen",
      "inAppClick",
      "inAppClose",
      "inAppDelete",
      "inAppDelivery",
      "inAppSendSkip",
      "inAppRecall",
      "inboxSession",
      "inboxMessageImpression",
      "smsSend",
      "smsBounce",
      "smsClick",
      "smsReceived",
      "smsSendSkip",
      "webPushSend",
      "webPushClick",
      "webPushSendSkip",
      "emailSubscribe",
      "emailUnSubscribe",
      "purchase",
      "customEvent",
      "user",
      "smsUsageInfo",
      "embeddedSend",
      "embeddedSendSkip",
      "embeddedClick",
      "embeddedReceived",
      "embeddedImpression",
      "embeddedSession",
      "anonSession",
      "journeyExit",
      "whatsAppBounce",
      "whatsAppClick",
      "whatsAppReceived",
      "whatsAppSeen",
      "whatsAppSend",
      "whatsAppSendSkip",
      "whatsAppUsageInfo",
    ])
    .describe(
      "Data type name to export (e.g., 'user' for user data, 'emailSend' for email send events)"
    ),
  outputFormat: z
    .enum(["text/csv", "application/x-json-stream"])
    .describe("Output format"),
  startDateTime: IterableDateTimeSchema.optional().describe(
    "Export events occurring or users updated after date and time inclusive"
  ),
  endDateTime: IterableDateTimeSchema.optional().describe(
    "Export events occurring or users updated before date and time exclusive"
  ),
  campaignId: z
    .number()
    .optional()
    .describe("Only export data from this campaign"),
  delimiter: z.string().optional().describe("CSV file delimiter"),
  omitFields: z
    .string()
    .optional()
    .describe("Fields to omit from the export (comma separated)"),
  onlyFields: z
    .string()
    .optional()
    .describe("Only include these fields in the export (comma separated)"),
});

export const CancelExportJobParamsSchema = z.object({
  jobId: z
    .number()
    .describe(
      "The ID of the export job to cancel (returned from startExportJob)"
    ),
});

export type GetExportJobsParams = z.infer<typeof GetExportJobsParamsSchema>;
export type GetExportFilesParams = z.infer<typeof GetExportFilesParamsSchema>;
export type StartExportJobParams = z.infer<typeof StartExportJobParamsSchema>;
export type CancelExportJobParams = z.infer<typeof CancelExportJobParamsSchema>;

// Export job state enum - API uses PlayLowercaseJsonEnum so values are lowercase
export const ExportJobStateSchema = z.enum([
  "enqueued",
  "running",
  "completed",
  "failed",
  "cancelling",
]);

// Export job schema - matches JobModel from API docs
export const ExportJobSchema = z.object({
  id: z.number(),
  dataTypeName: z.string(),
  jobState: ExportJobStateSchema,
  scheduledStartTime: z.string().optional(),
  endTime: z.string().optional(),
  bytesExported: z.number().optional(),
});

export type ExportJob = z.infer<typeof ExportJobSchema>;

export const StartExportJobResponseSchema = z.object({
  jobId: z.number(),
  message: z.string().optional(),
});

export type StartExportJobResponse = z.infer<
  typeof StartExportJobResponseSchema
>;

// Response schema for getExportJobs
export const GetExportJobsResponseSchema = z.object({
  jobs: z.array(ExportJobSchema),
});

export type GetExportJobsResponse = z.infer<typeof GetExportJobsResponseSchema>;

/**
 * Individual export file with download URL
 * Each file is up to 10MB in size
 */
export const ExportFileAndUrlSchema = z.object({
  file: z.string(),
  url: z.string(),
});

export type ExportFileAndUrl = z.infer<typeof ExportFileAndUrlSchema>;

/**
 * Response from getExportFiles containing job status and file download URLs
 * Files are added to the list as the export job runs
 */
export const GetExportFilesResponseSchema = z.object({
  exportTruncated: z.boolean(),
  files: z.array(ExportFileAndUrlSchema),
  jobId: z.number(),
  jobState: ExportJobStateSchema,
});

export type GetExportFilesResponse = z.infer<
  typeof GetExportFilesResponseSchema
>;

/**
 * Response from cancelExportJob
 * The cancel endpoint returns a simple success response
 */
export const CancelExportJobResponseSchema = z
  .object({
    msg: z.string().optional(),
    code: z.string().optional(),
  })
  .passthrough(); // Allow additional fields

export type CancelExportJobResponse = z.infer<
  typeof CancelExportJobResponseSchema
>;

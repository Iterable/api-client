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
export interface ExportJob {
  id: number;
  dataTypeName: string;
  jobState:
    | "enqueued"
    | "queued"
    | "running"
    | "completed"
    | "failed"
    | "cancelled"
    | "cancelling";
  scheduledStartTime?: string;
  endTime?: string;
  bytesExported?: number;
}

export const StartExportJobResponseSchema = z.object({
  jobId: z.number(),
  message: z.string().optional(),
});

export type StartExportJobResponse = z.infer<
  typeof StartExportJobResponseSchema
>;

export interface GetExportJobsResponse {
  jobs: ExportJob[];
}

/**
 * Individual export file with download URL
 * Each file is up to 10MB in size
 */
export interface ExportFileAndUrl {
  file: string;
  url: string;
}

/**
 * Response from getExportFiles containing job status and file download URLs
 * Files are added to the list as the export job runs
 */
export interface GetExportFilesResponse {
  exportTruncated: boolean;
  files: ExportFileAndUrl[];
  jobId: number;
  jobState: "Enqueued" | "Running" | "Completed" | "Failed";
}

export interface CancelExportJobResponse {
  // The cancel endpoint returns a simple success response
  // Based on API docs: "successful operation" with no specific schema
  [key: string]: unknown;
}

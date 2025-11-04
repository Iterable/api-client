import { z } from "zod";

import {
  createSortParamSchema,
  IterableDateTimeSchema,
  IterableISODateTimeSchema,
  SortParam,
  UnixTimestampSchema,
} from "./common.js";

/**
 * Campaign management schemas and types
 */

export const CampaignDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(["Blast", "Triggered"]),
  campaignState: z.enum([
    "Draft",
    "Ready",
    "Scheduled",
    "Running",
    "Finished",
    "Starting",
    "Aborted",
    "Recurring",
    "Archived",
  ]),
  messageMedium: z.string(),
  createdAt: UnixTimestampSchema,
  updatedAt: UnixTimestampSchema,
  createdByUserId: z.string(),
  templateId: z.number().optional(),
  updatedByUserId: z.string().optional(),
  startAt: UnixTimestampSchema.optional(),
  endedAt: UnixTimestampSchema.optional(),
  labels: z.array(z.string()).optional(),
  listIds: z.array(z.number()).optional(),
  suppressionListIds: z.array(z.number()).optional(),
  recurringCampaignId: z.number().optional(),
  sendSize: z.number().optional(),
  workflowId: z.number().optional(),
});

export type CampaignDetails = z.infer<typeof CampaignDetailsSchema>;

// Campaign sort fields
const CAMPAIGN_SORT_FIELDS = [
  "id",
  "name",
  "createdAt",
  "updatedAt",
  "startAt",
] as const;

// Get campaigns parameters schema
export const GetCampaignsParamsSchema = z.object({
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Page number (starting at 1)"),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe(
      "Number of results to return per page (defaults to 20, maximum of 1000)"
    ),
  sort: createSortParamSchema(CAMPAIGN_SORT_FIELDS).describe(
    "Field to sort campaigns by with optional direction (defaults to id ascending)"
  ),
});

export type GetCampaignsParams = z.infer<typeof GetCampaignsParamsSchema>;
export type CampaignSortParam = SortParam<
  (typeof CAMPAIGN_SORT_FIELDS)[number]
>;

// Response schemas
export const GetCampaignsResponseSchema = z.object({
  campaigns: z.array(CampaignDetailsSchema),
  nextPageUrl: z
    .string()
    .optional()
    .describe("The URL to the next page of campaigns, if applicable"),
  previousPageUrl: z
    .string()
    .optional()
    .describe("The URL to the previous page of campaigns, if applicable"),
  totalCampaignsCount: z
    .number()
    .describe(
      "The total count of campaigns across all pages for the supplied query"
    ),
});

export type GetCampaignsResponse = z.infer<typeof GetCampaignsResponseSchema>;

// Get single campaign endpoint
export const GetCampaignParamsSchema = z.object({
  id: z.number().describe("Campaign ID to retrieve"),
});

export const GetCampaignResponseSchema = CampaignDetailsSchema;

export type GetCampaignParams = z.infer<typeof GetCampaignParamsSchema>;
export type GetCampaignResponse = z.infer<typeof GetCampaignResponseSchema>;

export type GetCampaignMetricsParams = z.infer<
  typeof GetCampaignMetricsParamsSchema
>;
export type CreateCampaignParams = z.infer<typeof CreateCampaignParamsSchema>;
export type CreateCampaignResponse = z.infer<
  typeof CreateCampaignResponseSchema
>;
export type GetChildCampaignsParams = z.infer<
  typeof GetChildCampaignsParamsSchema
>;

export const GetCampaignMetricsParamsSchema = z.object({
  campaignId: z.number().describe("Campaign ID to get metrics for"),
  startDateTime: IterableDateTimeSchema.optional().describe(
    "Start date for metrics (YYYY-MM-DD HH:MM:SS format)"
  ),
  endDateTime: IterableDateTimeSchema.optional().describe(
    "End date for metrics (YYYY-MM-DD HH:MM:SS format)"
  ),
});

export const CampaignsResponseSchema = z.object({
  campaigns: z.array(CampaignDetailsSchema),
});

export const CampaignMetricsResponseSchema = z
  .array(z.record(z.string(), z.any()))
  .describe("Parsed campaign metrics data");

// Campaign creation schemas
export const CreateCampaignParamsSchema = z.object({
  name: z.string().describe("The name to use in Iterable for the new campaign"),
  templateId: z
    .number()
    .describe("The ID of a template to associate with the new campaign"),
  listIds: z
    .array(z.number())
    .describe(
      "Array of list IDs to which the campaign should be sent (for blast campaigns)"
    )
    .optional(),
  campaignDataFields: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "A JSON object containing campaign-level data fields that are available as merge parameters (for example, {{field}}) during message rendering. These fields are available in templates, data feed URLs, and all other contexts where merge parameters are supported. Campaign-level fields are overridden by user and event data fields of the same name."
    ),
  sendAt: IterableDateTimeSchema.optional().describe(
    "Scheduled send time for blast campaign (YYYY-MM-DD HH:MM:SS UTC). If not provided, the campaign will be sent immediately."
  ),
  sendMode: z
    .enum(["ProjectTimeZone", "RecipientTimeZone"])
    .optional()
    .describe("Send mode for blast campaigns"),
  startTimeZone: z
    .string()
    .optional()
    .describe("Starting timezone for recipient timezone sends (IANA format)"),
  defaultTimeZone: z
    .string()
    .optional()
    .describe(
      "Default timezone for recipients without known timezone (IANA format)"
    ),
  suppressionListIds: z
    .array(z.number())
    .optional()
    .describe("Array of suppression list IDs"),
});

export const CreateCampaignResponseSchema = z.object({
  campaignId: z.number(),
});

// Child campaigns schema
export const GetChildCampaignsParamsSchema = z.object({
  id: z.number().describe("ID of the recurring campaign"),
  page: z
    .number()
    .int()
    .min(1)
    .optional()
    .describe("Page number (starting at 1)"),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe(
      "Number of results to return per page (defaults to 20, maximum of 1000)"
    ),
  sort: createSortParamSchema(CAMPAIGN_SORT_FIELDS).describe(
    "Field to sort campaigns by with optional direction (defaults to id ascending)"
  ),
});

export const GetChildCampaignsResponseSchema = z.object({
  campaigns: z.array(CampaignDetailsSchema),
  nextPageUrl: z
    .string()
    .optional()
    .describe("The URL to the next page of campaigns, if applicable"),
  previousPageUrl: z
    .string()
    .optional()
    .describe("The URL to the previous page of campaigns, if applicable"),
  totalCampaignsCount: z
    .number()
    .describe(
      "The total count of campaigns across all pages for the supplied query"
    ),
});

export type GetChildCampaignsResponse = z.infer<
  typeof GetChildCampaignsResponseSchema
>;

// Campaign scheduling schemas
export const RecipientTimeZoneSchema = z.object({
  defaultTimeZone: z
    .string()
    .describe("Fallback timezone (IANA format, e.g. America/New_York)"),
  startTimeZone: z
    .string()
    .describe("Starting timezone (IANA format, e.g. America/New_York)"),
});

export const ScheduleCampaignParamsSchema = z.object({
  campaignId: z.number().describe("Campaign ID to schedule"),
  sendAt: IterableISODateTimeSchema.describe(
    "When to send (ISO-8601 format, e.g. 2024-12-20T10:15:30Z)"
  ),
  recipientTimeZone: RecipientTimeZoneSchema.optional().describe(
    "Recipient timezone configuration"
  ),
});

export type ScheduleCampaignParams = z.infer<
  typeof ScheduleCampaignParamsSchema
>;

// Abort campaign schema
export const AbortCampaignParamsSchema = z.object({
  campaignId: z.number().describe("Campaign ID to abort"),
});

export type AbortCampaignParams = z.infer<typeof AbortCampaignParamsSchema>;

// Cancel campaign schema
export const CancelCampaignParamsSchema = z.object({
  campaignId: z.number().describe("Campaign ID to cancel"),
});

export type CancelCampaignParams = z.infer<typeof CancelCampaignParamsSchema>;

// Activate triggered campaign schema
export const ActivateTriggeredCampaignParamsSchema = z.object({
  campaignId: z.number().describe("Triggered campaign ID to activate"),
});

export type ActivateTriggeredCampaignParams = z.infer<
  typeof ActivateTriggeredCampaignParamsSchema
>;

// Deactivate triggered campaign schema
export const DeactivateTriggeredCampaignParamsSchema = z.object({
  campaignId: z.number().describe("Triggered campaign ID to deactivate"),
});

export type DeactivateTriggeredCampaignParams = z.infer<
  typeof DeactivateTriggeredCampaignParamsSchema
>;

// Archive campaigns schema
export const ArchiveCampaignsParamsSchema = z.object({
  campaignIds: z.array(z.number()).min(1).describe("Campaign IDs to archive"),
});

export type ArchiveCampaignsParams = z.infer<
  typeof ArchiveCampaignsParamsSchema
>;

// Archive campaigns response schema
export const ArchiveCampaignsResponseSchema = z.object({
  success: z
    .array(z.number())
    .describe("Campaign IDs that were successfully archived"),
  failed: z
    .array(z.any())
    .describe("Campaign IDs that failed to archive with error details"),
});

export type ArchiveCampaignsResponse = z.infer<
  typeof ArchiveCampaignsResponseSchema
>;

// Trigger campaign schema
export const TriggerCampaignParamsSchema = z.object({
  campaignId: z.number().describe("Campaign ID to trigger"),
  listIds: z
    .array(z.number())
    .min(1)
    .describe("A non-empty array of list IDs to send to"),
  dataFields: z
    .record(z.string(), z.any())
    .optional()
    .describe("Fields to merge into handlebars context"),
  suppressionListIds: z
    .array(z.number())
    .optional()
    .describe("Lists to suppress"),
  allowRepeatMarketingSends: z
    .boolean()
    .optional()
    .describe("Allow repeat marketing sends? Defaults to true."),
});

export type TriggerCampaignParams = z.infer<typeof TriggerCampaignParamsSchema>;

// Send campaign schema
export const SendCampaignParamsSchema = z.object({
  campaignId: z.number().describe("Campaign ID to send now"),
});

export type SendCampaignParams = z.infer<typeof SendCampaignParamsSchema>;

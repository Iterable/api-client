import { z } from "zod";

import { IterableDateTimeSchema } from "./common.js";

/**
 * Experiment metrics schemas and types
 */

// The API returns CSV data which we parse into objects
export const ExperimentMetricsResponseSchema = z
  .array(z.record(z.string(), z.string()))
  .describe("Parsed experiment metrics data");

export const GetExperimentMetricsParamsSchema = z
  .object({
    experimentId: z
      .array(z.number())
      .optional()
      .describe("Experiment IDs to export (can specify multiple)"),
    campaignId: z
      .array(z.number())
      .optional()
      .describe(
        "Campaign IDs whose experiments to export (can specify multiple)"
      ),
    startDateTime: IterableDateTimeSchema.optional().describe(
      "Export starting from (ISO 8601 format)"
    ),
    endDateTime: IterableDateTimeSchema.optional().describe(
      "Export ending at (ISO 8601 format)"
    ),
  })
  .describe("Parameters for getting experiment metrics");

// Type exports
export type ExperimentMetricsResponse = z.infer<
  typeof ExperimentMetricsResponseSchema
>;
export type GetExperimentMetricsParams = z.infer<
  typeof GetExperimentMetricsParamsSchema
>;

/**
 * Experiment list schemas and types
 */

export const ExperimentStatusSchema = z.enum(["draft", "running", "finished"]);

export const ExperimentListItemSchema = z.object({
  id: z.number().describe("Experiment ID"),
  name: z.string().describe("Experiment name"),
  status: ExperimentStatusSchema.describe("Experiment status"),
  startDate: z.string().optional().describe("Start date (ISO 8601)"),
  channelType: z.string().describe("Channel type (e.g., email, push)"),
  author: z.string().describe("Author email or name"),
});

export const ListExperimentsParamsSchema = z
  .object({
    campaignId: z.number().optional().describe("Filter by campaign ID"),
    status: ExperimentStatusSchema.optional().describe(
      "Filter by status (draft, running, finished)"
    ),
    startDate: IterableDateTimeSchema.optional().describe(
      "Filter experiments starting from this date (ISO 8601 format)"
    ),
    endDate: IterableDateTimeSchema.optional().describe(
      "Filter experiments ending before this date (ISO 8601 format)"
    ),
    limit: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .default(20)
      .describe("Number of results to return (max 1000, default 20)"),
    offset: z
      .number()
      .int()
      .min(0)
      .default(0)
      .describe("Number of results to skip (default 0)"),
  })
  .describe("Parameters for listing experiments");

export const ListExperimentsResponseSchema = z.object({
  experiments: z.array(ExperimentListItemSchema),
  totalCount: z.number().optional().describe("Total number of experiments"),
});

export type ExperimentStatus = z.infer<typeof ExperimentStatusSchema>;
export type ExperimentListItem = z.infer<typeof ExperimentListItemSchema>;
export type ListExperimentsParams = z.infer<typeof ListExperimentsParamsSchema>;
export type ListExperimentsResponse = z.infer<
  typeof ListExperimentsResponseSchema
>;

/**
 * Get experiment schemas and types
 */

export const ExperimentVariantSummarySchema = z.object({
  id: z.number().describe("Variant ID"),
  name: z.string().describe("Variant name"),
  percentage: z.number().describe("Traffic percentage"),
});

export const ExperimentConstraintsSchema = z
  .object({
    startDate: z.string().optional().describe("Experiment start date"),
    endDate: z.string().optional().describe("Experiment end date"),
    timezone: z.string().optional().describe("Timezone"),
  })
  .passthrough();

export const ExperimentDetailsSchema = z.object({
  id: z.number().describe("Experiment ID"),
  name: z.string().describe("Experiment name"),
  status: ExperimentStatusSchema.describe("Experiment status"),
  campaignId: z.number().optional().describe("Associated campaign ID"),
  channelType: z.string().describe("Channel type"),
  author: z.string().describe("Author"),
  createdAt: z.string().optional().describe("Creation timestamp"),
  updatedAt: z.string().optional().describe("Last update timestamp"),
  variants: z
    .array(ExperimentVariantSummarySchema)
    .optional()
    .describe("Experiment variants"),
  constraints: ExperimentConstraintsSchema.optional().describe(
    "Experiment constraints and settings"
  ),
});

export const GetExperimentParamsSchema = z
  .object({
    experimentId: z.number().describe("Experiment ID"),
  })
  .describe("Parameters for getting experiment details");

export type ExperimentVariantSummary = z.infer<
  typeof ExperimentVariantSummarySchema
>;
export type ExperimentConstraints = z.infer<typeof ExperimentConstraintsSchema>;
export type ExperimentDetails = z.infer<typeof ExperimentDetailsSchema>;
export type GetExperimentParams = z.infer<typeof GetExperimentParamsSchema>;

/**
 * Get experiment variants schemas and types
 */

export const ExperimentVariantContentSchema = z.object({
  id: z.number().describe("Variant ID"),
  name: z.string().describe("Variant name"),
  percentage: z.number().describe("Traffic percentage"),
  subject: z.string().optional().describe("Email subject line"),
  preheader: z.string().optional().describe("Email preheader"),
  htmlSource: z.string().optional().describe("HTML email content"),
  plainText: z.string().optional().describe("Plain text email content"),
});

export const GetExperimentVariantsParamsSchema = z
  .object({
    experimentId: z.number().describe("Experiment ID"),
  })
  .describe("Parameters for getting experiment variants");

export const GetExperimentVariantsResponseSchema = z.object({
  variants: z.array(ExperimentVariantContentSchema),
});

export type ExperimentVariantContent = z.infer<
  typeof ExperimentVariantContentSchema
>;
export type GetExperimentVariantsParams = z.infer<
  typeof GetExperimentVariantsParamsSchema
>;
export type GetExperimentVariantsResponse = z.infer<
  typeof GetExperimentVariantsResponseSchema
>;

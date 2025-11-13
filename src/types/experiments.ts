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

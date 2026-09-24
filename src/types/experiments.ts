import { z } from "zod";

import {
  FlexibleTimestampSchema,
  IterableDateTimeSchema,
  IterableISODateTimeSchema,
} from "./common.js";

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
      .optional()
      .describe("Number of results to return (max 1000, default 20)"),
    offset: z
      .number()
      .int()
      .min(0)
      .optional()
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

export const GetExperimentParamsSchema = z
  .object({
    experimentId: z.number().describe("Experiment ID"),
  })
  .describe("Parameters for getting experiment details");

export type GetExperimentParams = z.infer<typeof GetExperimentParamsSchema>;

export const GetExperimentVariantsParamsSchema = z
  .object({
    experimentId: z.number().describe("Experiment ID"),
  })
  .describe("Parameters for getting experiment variants");

export type GetExperimentVariantsParams = z.infer<
  typeof GetExperimentVariantsParamsSchema
>;

/**
 * GET /api/experiments/{id} and the experiment write routes.
 * name and campaignId mirror meta. variant.percentage mirrors currentPercentage.
 */

export const ExperimentApiStatusSchema = z.enum([
  "draft",
  "ready",
  "running",
  "finished",
  "winner_found",
]);

export const ExperimentChannelTypeSchema = z.enum([
  "email",
  "push",
  "sms",
  "in_app",
  "web_push",
]);

export const AllocationModeSchema = z.enum([
  "even_split",
  "winner_takes_all",
  "multi_armed_bandit",
]);

export const ExperimentVariantValueSchema = z.object({
  templateId: z.number().nullish().describe("Template ID"),
  sendTime: z.string().nullish().describe("Send time (ISO 8601)"),
  stoGroup: z.string().nullish().describe("Send-time optimization group"),
});

/**
 * GET /api/experiments/{id}/variants.
 * id mirrors variantId. percentage mirrors currentPercentage.
 */

export const TemplateContentSchema = z.object({
  subject: z.string().nullish().describe("Email subject line"),
  preheader: z.string().nullish().describe("Email preheader"),
  htmlSource: z.string().nullish().describe("HTML email content"),
  plainText: z.string().nullish().describe("Plain text email content"),
});

export const ExperimentVariantContentSchema = z
  .object({
    variantId: z.number().describe("Variant ID"),
    name: z.string().describe("Variant name"),
    value: ExperimentVariantValueSchema.describe("Typed variant value"),
    currentPercentage: z.number().describe("Current traffic percentage"),
    content: TemplateContentSchema.nullish().describe("Template content"),
  })
  .transform((variant) => ({
    ...variant,
    id: variant.variantId,
    percentage: variant.currentPercentage,
  }));

export const GetExperimentVariantsResponseSchema = z.object({
  experimentId: z.number().describe("Experiment ID"),
  variants: z.array(ExperimentVariantContentSchema),
});

export type ExperimentVariantContent = z.infer<
  typeof ExperimentVariantContentSchema
>;
export type GetExperimentVariantsResponse = z.infer<
  typeof GetExperimentVariantsResponseSchema
>;

export const ExperimentResponseVariantSchema = z.object({
  id: z.number().describe("Variant ID"),
  name: z.string().describe("Variant name"),
  value: ExperimentVariantValueSchema.describe("Typed variant value"),
  currentPercentage: z.number().describe("Current traffic percentage"),
  isWinner: z.boolean().describe("Whether this variant is the winner"),
  isControl: z.boolean().describe("Whether this variant is the control"),
});

export const ExperimentSizingSchema = z.object({
  holdoutPercentage: z.number().nullish(),
  perVariantPercentage: z.number().nullish(),
  testGroupPercentage: z.number().nullish(),
  winnerGroupPercentage: z.number().nullish(),
  testDurationMinutes: z.number().nullish(),
  sendsPerVariant: z.number().nullish(),
  attributionPeriodHours: z.number().nullish(),
});

export const ExperimentMetaSchema = z.object({
  name: z.string().describe("Experiment name"),
  conversionMetrics: z.array(z.string()).describe("Conversion metrics"),
  campaignId: z.number().nullish().describe("Campaign ID"),
  projectId: z.number().describe("Project ID"),
  orgId: z.number().describe("Organization ID"),
  customConversionId: z
    .number()
    .nullish()
    .describe("Custom conversion catalog ID"),
});

export const ExperimentResponseConstraintsSchema = z.object({
  targetSegment: z.string().nullish(),
  suppressionListIds: z.array(z.number()),
});

export const ExperimentResponseSchema = z
  .object({
    id: z.number().describe("Experiment ID"),
    status: ExperimentApiStatusSchema.describe("Experiment status"),
    creationDate: FlexibleTimestampSchema.nullish().describe(
      "Creation timestamp as epoch time in milliseconds"
    ),
    startDate: FlexibleTimestampSchema.nullish().describe(
      "Start timestamp as epoch time in milliseconds"
    ),
    finishDate: FlexibleTimestampSchema.nullish().describe(
      "Finish timestamp as epoch time in milliseconds"
    ),
    channelType: ExperimentChannelTypeSchema.describe("Channel type"),
    experimentType: z.string().describe("Experiment type"),
    allocationMode: AllocationModeSchema.describe("Traffic allocation mode"),
    sizing: ExperimentSizingSchema.describe("Traffic allocation sizing"),
    meta: ExperimentMetaSchema.describe("Experiment metadata"),
    variants: z.array(ExperimentResponseVariantSchema).describe("Variants"),
    constraints: ExperimentResponseConstraintsSchema.nullish().describe(
      "Experiment constraints"
    ),
  })
  .transform((experiment) => ({
    ...experiment,
    name: experiment.meta.name,
    campaignId: experiment.meta.campaignId,
    variants: experiment.variants.map((variant) => ({
      ...variant,
      percentage: variant.currentPercentage,
    })),
  }));

export type ExperimentResponse = z.infer<typeof ExperimentResponseSchema>;

export const ExperimentDetailsSchema = ExperimentResponseSchema;

export type ExperimentDetails = ExperimentResponse;

export const ExperimentIdParamsSchema = z
  .object({
    experimentId: z.number().describe("Experiment ID"),
  })
  .describe("Parameters that identify an experiment");

export type ExperimentIdParams = z.infer<typeof ExperimentIdParamsSchema>;

/**
 * GET /api/experiments/{id}/totals
 */

export const ExperimentVariantTotalsSchema = z.object({
  id: z.number().describe("Variant ID"),
  name: z.string().describe("Variant name"),
  isControl: z.boolean().describe("Whether this variant is the control"),
  isWinner: z.boolean().describe("Whether this variant is the winner"),
  metrics: z
    .record(z.string(), z.number())
    .describe("Lifetime send and conversion totals"),
});

export const ExperimentTotalsResponseSchema = z.object({
  id: z.number().describe("Experiment ID"),
  status: ExperimentApiStatusSchema.describe("Experiment status"),
  variants: z.array(ExperimentVariantTotalsSchema),
});

export const GetExperimentTotalsParamsSchema = ExperimentIdParamsSchema;

export type ExperimentTotalsResponse = z.infer<
  typeof ExperimentTotalsResponseSchema
>;
export type GetExperimentTotalsParams = z.infer<
  typeof GetExperimentTotalsParamsSchema
>;

/**
 * GET /api/experiments/{id}/trends
 */

export const ExperimentTrendsPointSchema = z.object({
  time: z.string().describe("Bucket start time (ISO 8601)"),
  value: z.number().describe("Metric value for this bucket"),
});

export const ExperimentTrendsVariantSchema = z.object({
  id: z.number().describe("Variant ID, or -1 for holdout"),
  name: z.string().describe("Variant name"),
  isControl: z.boolean().describe("Whether this variant is the control"),
  isWinner: z.boolean().describe("Whether this variant is the winner"),
  series: z
    .record(z.string(), z.array(ExperimentTrendsPointSchema))
    .describe("Histogram series keyed by metric name"),
});

export const ExperimentTrendsResponseSchema = z.object({
  id: z.number().describe("Experiment ID"),
  status: ExperimentApiStatusSchema.describe("Experiment status"),
  interval: z.string().describe("Histogram interval"),
  startDateTime: z.string().describe("Series start (ISO 8601)"),
  endDateTime: z.string().describe("Series end (ISO 8601)"),
  variants: z.array(ExperimentTrendsVariantSchema),
  holdout: ExperimentTrendsVariantSchema.nullish().describe(
    "Holdout series when the experiment has a holdout group"
  ),
});

export const GetExperimentTrendsParamsSchema = z
  .object({
    experimentId: z.number().describe("Experiment ID"),
    startDateTime: IterableISODateTimeSchema.optional().describe(
      "Series start (ISO 8601). Required when endDateTime is set."
    ),
    endDateTime: IterableISODateTimeSchema.optional().describe(
      "Series end (ISO 8601). Required when startDateTime is set."
    ),
  })
  .refine(
    (value) =>
      (value.startDateTime === undefined) === (value.endDateTime === undefined),
    {
      message: "Provide both startDateTime and endDateTime, or omit both.",
    }
  )
  .describe("Parameters for getting experiment trends");

export type ExperimentTrendsResponse = z.infer<
  typeof ExperimentTrendsResponseSchema
>;
export type GetExperimentTrendsParams = z.infer<
  typeof GetExperimentTrendsParamsSchema
>;

/**
 * Write routes. Success body is the public experiment response.
 */

export const ExperimentTypeSchema = z.enum([
  "SubjectLine",
  "PreheaderText",
  "FromNameAndSender",
  "EmailBody",
  "WholeEmail",
]);

export const CreateExperimentParamsSchema = z
  .object({
    campaignId: z.number().describe("Campaign ID"),
    experimentType: ExperimentTypeSchema.describe(
      "What to test. Send-time, send-time optimization, and frequency optimization are not supported."
    ),
    name: z
      .string()
      .optional()
      .describe(
        "Display name. If omitted, Iterable uses '{campaign name} Experiment'."
      ),
  })
  .describe("Parameters for creating a draft campaign experiment");

export type CreateExperimentParams = z.infer<
  typeof CreateExperimentParamsSchema
>;

export const CopyExperimentVariantParamsSchema = z
  .object({
    experimentId: z.number().describe("Experiment ID"),
    copyFromTemplateId: z
      .number()
      .describe("Template ID to copy into a new variant"),
    name: z.string().optional().describe("Display name for the new variant"),
  })
  .describe("Parameters for copying a template as a new variant");

export type CopyExperimentVariantParams = z.infer<
  typeof CopyExperimentVariantParamsSchema
>;

export const ConversionEventSettingsSchema = z.object({
  systemConversionEventType: z
    .enum(["Opens", "Clicks", "opens", "clicks"])
    .optional()
    .describe(
      "System conversion type. Use customConversionId for other events."
    ),
  customConversionId: z.number().optional().describe("Conversion catalog ID"),
});

export const HoldoutSettingsSchema = z.object({
  holdOutGroupSize: z
    .number()
    .int()
    .min(1)
    .max(99)
    .describe("Holdout group size as a percent from 1 to 99"),
  attributionPeriodHours: z
    .number()
    .int()
    .describe("Attribution window in hours"),
});

export const BlastExplorationSettingsSchema = z.object({
  testSizePercentage: z
    .number()
    .int()
    .min(1)
    .max(99)
    .describe("Test group size as a percent from 1 to 99"),
  testDurationMinutes: z
    .number()
    .int()
    .describe("Test phase duration in minutes"),
});

export const TriggerExplorationSettingsSchema = z.object({
  testSendsPerVariation: z
    .number()
    .int()
    .describe(
      "Minimum sends each variant must receive before a winner can be selected"
    ),
});

export const UpdateExperimentSettingsParamsSchema = z
  .object({
    experimentId: z.number().describe("Experiment ID"),
    conversionEventSettings: ConversionEventSettingsSchema.nullable()
      .optional()
      .describe("Conversion settings. Omit to leave unchanged."),
    holdoutSettings: HoldoutSettingsSchema.nullable()
      .optional()
      .describe(
        "Holdout settings. Null removes them. Omit to leave unchanged."
      ),
    explorationBlastSettings: BlastExplorationSettingsSchema.nullable()
      .optional()
      .describe(
        "Blast exploration settings. Null removes them. Omit to leave unchanged."
      ),
    explorationTriggerSettings: TriggerExplorationSettingsSchema.nullable()
      .optional()
      .describe(
        "Trigger exploration settings. Null removes them. Omit to leave unchanged."
      ),
    evenlySplitVariations: z
      .boolean()
      .optional()
      .describe(
        "Set true to split traffic evenly and clear blast and trigger settings. false is rejected. Omit to leave allocation unchanged."
      ),
  })
  .describe("Parameters for updating experiment settings");

export type UpdateExperimentSettingsParams = z.infer<
  typeof UpdateExperimentSettingsParamsSchema
>;

export const DeclareExperimentWinnerParamsSchema = z
  .object({
    experimentId: z.number().describe("Experiment ID"),
    variantId: z
      .number()
      .describe(
        "Variant ID to declare as the winner. The holdout group cannot be selected."
      ),
  })
  .describe("Parameters for declaring a winning variant");

export type DeclareExperimentWinnerParams = z.infer<
  typeof DeclareExperimentWinnerParamsSchema
>;

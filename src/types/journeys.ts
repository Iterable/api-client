import { z } from "zod";

import {
  createSortParamSchema,
  SortParam,
  UnixTimestampSchema,
} from "./common.js";

/**
 * Journey (workflow) management schemas and types
 */

export const JourneyDraftDetailsSchema = z.object({
  id: z.number(),
  createdAt: UnixTimestampSchema,
  updatedAt: UnixTimestampSchema,
  name: z.string(),
  creatorUserId: z.string(),
});

export const JourneySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean(),
  isArchived: z.boolean(),
  journeyType: z.string(),
  lifetimeLimit: z.number().optional(),
  simultaneousLimit: z.number().optional(),
  startTileId: z.number().optional(),
  triggerEventNames: z.array(z.string()).optional(),
  createdAt: UnixTimestampSchema, // API docs: "format": "int32"
  updatedAt: UnixTimestampSchema, // API docs: "format": "int32"
  creatorUserId: z.string().optional(),
  draft: JourneyDraftDetailsSchema.nullable().optional(),
});

export const GetJourneysResponseSchema = z.object({
  journeys: z.array(JourneySchema),
  totalJourneysCount: z.number(),
  nextPageUrl: z.string().optional(),
  previousPageUrl: z.string().optional(),
});

export type JourneyDraftDetails = z.infer<typeof JourneyDraftDetailsSchema>;
export type Journey = z.infer<typeof JourneySchema>;
export type GetJourneysResponse = z.infer<typeof GetJourneysResponseSchema>;

// Journey sort fields
const JOURNEY_SORT_FIELDS = ["id", "name", "createdAt", "updatedAt"] as const;

// Journey parameter schemas
export const GetJourneysParamsSchema = z
  .object({
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
      .max(50)
      .optional()
      .describe("Number of results per page (max 50)"),
    sort: createSortParamSchema(JOURNEY_SORT_FIELDS).describe(
      "Sort field with optional direction (defaults to id ascending)"
    ),
    state: z
      .array(z.string())
      .optional()
      .describe("Filter by journey state (e.g., ['Archived'])"),
  })
  .describe(
    "Parameters for getting journeys with optional pagination and filtering"
  );

export type JourneySortParam = SortParam<(typeof JOURNEY_SORT_FIELDS)[number]>;

export const TriggerJourneyParamsSchema = z.object({
  workflowId: z.number().describe("Journey/workflow ID to trigger"),
  email: z.email().optional().describe("User email address"),
  userId: z.string().optional().describe("User ID (alternative to email)"),
  listId: z
    .number()
    .optional()
    .describe("List ID to trigger for (alternative to individual user)"),
  dataFields: z
    .record(z.string(), z.any())
    .optional()
    .describe("Data fields for the journey"),
});

const MAX_JOURNEY_DSL_SELECTIONS = 50;

/**
 * Opaque/pre-1.0 JSON object. Nested values are not interpreted so extra keys
 * and evolving blobs such as tileData are not stripped.
 */
const JsonObjectSchema = z.record(z.string(), z.unknown());

export const JourneyWorkflowTypeSchema = z
  .enum(["Draft", "Published"])
  .describe("Whether to retrieve the draft or published workflow");

export const JourneyDslSelectionSchema = z
  .object({
    workflowId: z
      .number()
      .int()
      .positive()
      .describe(
        "Workflow ID from get_journeys: use journey.id for a Published journey, journey.draft.id for its nested draft, or journey.id when journeyType is Draft"
      ),
    workflowType: JourneyWorkflowTypeSchema.default("Published").describe(
      "Use Draft with a draft workflow ID; use Published (the default) with a published workflow ID"
    ),
  })
  .describe("A draft or published workflow to include in a DSL graph request");

function uniqueJourneyDslSelections(
  journeys: Array<{ workflowId: number; workflowType: "Draft" | "Published" }>,
  ctx: z.RefinementCtx
): void {
  const uniqueKeys = new Set(
    journeys.map(
      ({ workflowId, workflowType }) => `${workflowType}:${workflowId}`
    )
  );
  if (uniqueKeys.size !== journeys.length) {
    ctx.addIssue({
      code: "custom",
      message:
        "journeys contains duplicate (workflowType, workflowId) selections",
    });
  }
}

export const GetJourneyDslGraphParamsSchema = z
  .object({
    journeys: z
      .array(JourneyDslSelectionSchema)
      .min(1)
      .max(MAX_JOURNEY_DSL_SELECTIONS)
      .superRefine(uniqueJourneyDslSelections)
      .describe("Workflows to retrieve"),
  })
  .describe("Parameters for retrieving Journey DSL graphs");

export const JourneyDslSchemaManifestSchema = z
  .object({
    version: z.string(),
    schemaEndpoint: z.string(),
  })
  .passthrough();

export const JourneyDslEntityRefSchema = z
  .object({
    field: z.string(),
    entityType: z.string(),
    id: z.number(),
    path: z.string().nullable().optional(),
  })
  .passthrough();

export const JourneyDslValidationIssueSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    nodeId: z.number().nullable().optional(),
  })
  .passthrough();

export const JourneyDslCompletenessSchema = z
  .object({
    requiredFieldsPresent: z.boolean(),
    issues: z.array(JourneyDslValidationIssueSchema),
  })
  .passthrough();

export const JourneyDslNodeSchema = z
  .object({
    nodeId: z.number(),
    nodeType: z.string(),
    title: z.string(),
    tileData: JsonObjectSchema,
    entityRefs: z.array(JourneyDslEntityRefSchema),
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .passthrough();

export const JourneyDslEdgeSchema = z
  .object({
    srcNodeId: z.number(),
    destNodeId: z.number(),
    outputIndex: z.number().int(),
    label: z.string().nullable().optional(),
  })
  .passthrough();

export type JourneyDslTriggerRule = {
  ruleType: string;
  eventName?: string | null;
  searchQuery?: Record<string, unknown> | null;
  subRules?: JourneyDslTriggerRule[] | null;
};

export const JourneyDslTriggerRuleSchema: z.ZodType<JourneyDslTriggerRule> =
  z.lazy(() =>
    z
      .object({
        ruleType: z.string(),
        eventName: z.string().nullable().optional(),
        searchQuery: JsonObjectSchema.nullable().optional(),
        subRules: z.array(JourneyDslTriggerRuleSchema).nullable().optional(),
      })
      .passthrough()
  );

export const JourneyDslExitRuleSchema = z
  .object({
    id: z.string(),
    status: z.string(),
    source: z.string(),
    triggerRule: JourneyDslTriggerRuleSchema,
    sendToJourneyId: z.number().nullable().optional(),
    entityRefs: z.array(JourneyDslEntityRefSchema),
  })
  .passthrough();

export const JourneyDslCustomConversionSchema = z
  .object({
    eventName: z.string(),
    attributionMode: z.string(),
    attributionPeriodHours: z.number().int().nullable().optional(),
  })
  .passthrough();

export const JourneyDslConversionGoalSchema = z
  .object({
    id: z.number(),
    isActive: z.boolean(),
    conversions: z.array(JourneyDslCustomConversionSchema),
  })
  .passthrough();

export const JourneyDslJourneySchema = z
  .object({
    journeyId: z.number(),
    name: z.string(),
    description: z.string(),
    status: z.string(),
    journeyType: JourneyWorkflowTypeSchema,
    createdAt: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
    simultaneousLimit: z.number().nullable().optional(),
    lifetimeLimit: z.number().nullable().optional(),
    triggerEventNames: z.array(z.string()),
    exitRules: z.array(JourneyDslExitRuleSchema),
    conversionGoals: z.array(JourneyDslConversionGoalSchema),
    labelIds: z.array(z.number()),
    isArchived: z.boolean(),
  })
  .passthrough();

export const JourneyDslDocumentSchema = z
  .object({
    schemaVersion: z.string(),
    journey: JourneyDslJourneySchema,
    startNodeId: z.number(),
    nodes: z.array(JourneyDslNodeSchema),
    edges: z.array(JourneyDslEdgeSchema),
    completeness: JourneyDslCompletenessSchema,
    schema: JourneyDslSchemaManifestSchema,
  })
  .passthrough();

export const JourneyDslJourneyErrorSchema = z
  .object({
    workflowId: z.number(),
    workflowType: JourneyWorkflowTypeSchema,
    error: z.string(),
    message: z.string(),
  })
  .passthrough();

export const GetJourneyDslGraphResponseSchema = z
  .object({
    journeys: z.array(JourneyDslDocumentSchema),
    errors: z.array(JourneyDslJourneyErrorSchema),
    schema: JourneyDslSchemaManifestSchema,
  })
  .passthrough();

export const JourneyDslOutputCountSchema = z.union([
  z.number().int().nonnegative(),
  z.literal("dynamic"),
]);

export const JourneyDslTileTypeSchema = z
  .object({
    tileType: z.string(),
    category: z.string(),
    numOutputs: JourneyDslOutputCountSchema,
    description: z.string(),
    tileDataSchema: JsonObjectSchema,
    outputs: z
      .array(
        z
          .object({
            index: z.number().int(),
            label: z.string(),
            description: z.string(),
          })
          .passthrough()
      )
      .nullable()
      .optional(),
  })
  .passthrough();

export const JourneyDslTileTypeManifestSchema = z
  .object({
    kind: z.string(),
    version: z.string(),
    tileSchemas: z.array(JourneyDslTileTypeSchema),
    entityTypes: z.array(z.object({ entityType: z.string() }).passthrough()),
  })
  .passthrough();

export type JourneyWorkflowType = z.infer<typeof JourneyWorkflowTypeSchema>;
export type JourneyDslSelection = z.input<typeof JourneyDslSelectionSchema>;
export type GetJourneyDslGraphParams = z.input<
  typeof GetJourneyDslGraphParamsSchema
>;
export type JourneyDslSchemaManifest = z.infer<
  typeof JourneyDslSchemaManifestSchema
>;
export type JourneyDslEntityRef = z.infer<typeof JourneyDslEntityRefSchema>;
export type JourneyDslValidationIssue = z.infer<
  typeof JourneyDslValidationIssueSchema
>;
export type JourneyDslCompleteness = z.infer<
  typeof JourneyDslCompletenessSchema
>;
export type JourneyDslNode = z.infer<typeof JourneyDslNodeSchema>;
export type JourneyDslEdge = z.infer<typeof JourneyDslEdgeSchema>;
export type JourneyDslExitRule = z.infer<typeof JourneyDslExitRuleSchema>;
export type JourneyDslCustomConversion = z.infer<
  typeof JourneyDslCustomConversionSchema
>;
export type JourneyDslConversionGoal = z.infer<
  typeof JourneyDslConversionGoalSchema
>;
export type JourneyDslJourney = z.infer<typeof JourneyDslJourneySchema>;
export type JourneyDslDocument = z.infer<typeof JourneyDslDocumentSchema>;
export type JourneyDslJourneyError = z.infer<
  typeof JourneyDslJourneyErrorSchema
>;
export type GetJourneyDslGraphResponse = z.infer<
  typeof GetJourneyDslGraphResponseSchema
>;
export type JourneyDslOutputCount = z.infer<typeof JourneyDslOutputCountSchema>;
export type JourneyDslTileType = z.infer<typeof JourneyDslTileTypeSchema>;
export type JourneyDslTileTypeManifest = z.infer<
  typeof JourneyDslTileTypeManifestSchema
>;

export type GetJourneysParams = z.infer<typeof GetJourneysParamsSchema>;
export type TriggerJourneyParams = z.infer<typeof TriggerJourneyParamsSchema>;

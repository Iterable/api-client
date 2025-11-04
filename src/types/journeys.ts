import { z } from "zod";

import {
  createSortParamSchema,
  SortParam,
  UnixTimestampSchema,
} from "./common.js";

/**
 * Journey (workflow) management schemas and types
 */

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
});

export const GetJourneysResponseSchema = z.object({
  journeys: z.array(JourneySchema),
  totalJourneysCount: z.number(),
  nextPageUrl: z.string().optional(),
  previousPageUrl: z.string().optional(),
});

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

// Type exports
export type GetJourneysParams = z.infer<typeof GetJourneysParamsSchema>;
export type TriggerJourneyParams = z.infer<typeof TriggerJourneyParamsSchema>;

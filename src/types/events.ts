import { z } from "zod";

import { FlexibleTimestampSchema, UnixTimestampSchema } from "./common.js";

/**
 * Event tracking schemas and types
 */

/** Base event schema without validation */
const BaseTrackEventSchema = z.object({
  email: z.email().optional(),
  userId: z.string().min(1).optional(),
  eventName: z.string().min(1),
  id: z.string().min(1).max(512).optional(),
  dataFields: z.record(z.string(), z.any()).optional(),
  campaignId: z.number().int().positive().optional(),
  templateId: z.number().int().positive().optional(),
  createdAt: UnixTimestampSchema.optional(), // API expects Unix timestamp
  createNewFields: z.boolean().optional(),
});

/** Single event (track) */
export const TrackEventParamsSchema = BaseTrackEventSchema.refine(
  (v) => !!(v.email || v.userId),
  { message: "Provide either email or userId." }
);

export type TrackEventParams = z.infer<typeof TrackEventParamsSchema>;

/** Bulk events */
export const TrackBulkEventsParamsSchema = z.object({
  events: z
    .array(
      BaseTrackEventSchema.omit({ createNewFields: true }) // safer: not used by bulk
        .refine((v) => !!(v.email || v.userId), {
          message: "Provide either email or userId.",
        })
    )
    .min(1),
});
export type TrackBulkEventsParams = z.infer<typeof TrackBulkEventsParamsSchema>;

/** Loose reader schema for GET /events/... (allows extra fields) */
export const EventRecordSchema = z
  .object({
    _id: z.string().optional(),
    eventType: z.string().optional(), // system events
    eventName: z.string().optional(), // custom events
    email: z.email().optional(),
    userId: z.string().min(1).optional(),
    createdAt: FlexibleTimestampSchema.optional(), // API returns various formats
    dataFields: z.record(z.string(), z.any()).optional(),
    campaignId: z.number().int().optional(),
    templateId: z.number().int().optional(),
    messageId: z.string().optional(),
  })
  .passthrough();

export type EventRecord = z.infer<typeof EventRecordSchema>;

// Bulk event tracking schema
export const BulkEventSchema = z
  .object({
    eventName: z.string().describe("Name of event"),
    email: z.email().optional().describe("User email address"),
    userId: z.string().optional().describe("User ID (alternative to email)"),
    dataFields: z
      .record(z.string(), z.any())
      .optional()
      .describe("Event data fields"),
    campaignId: z.number().optional().describe("Campaign tied to conversion"),
    templateId: z.number().optional().describe("Template id"),
    id: z
      .string()
      .optional()
      .describe(
        "Optional event id. If an event exists with that id, the event will be updated"
      ),
    createdAt: z
      .number()
      .optional()
      .describe(
        "Time event happened. Set to the time event was received if unspecified. Expects a unix timestamp"
      ),
    createNewFields: z
      .boolean()
      .optional()
      .describe(
        "Whether new fields should be ingested and added to the schema. Defaults to project's setting"
      ),
  })
  .refine(
    (data) => data.email || data.userId,
    "Either email or userId must be provided"
  );

// Response schemas based on API specification
export const FailedEventUpdatesSchema = z.object({
  invalidEmails: z.array(z.string()).optional(),
  invalidUserIds: z.array(z.string()).optional(),
  failedEmails: z.array(z.string()).optional(),
  failedUserIds: z.array(z.string()).optional(),
});

export const BulkTrackResponseSchema = z.object({
  successCount: z.number(),
  failCount: z.number(),
  createdFields: z.array(z.string()).optional(),
  filteredOutFields: z.array(z.string()).optional(),
  disallowedEventNames: z.array(z.string()).optional(),
  failedUpdates: FailedEventUpdatesSchema.optional(),
  // Deprecated fields but still present
  invalidEmails: z.array(z.string()).optional(),
  invalidUserIds: z.array(z.string()).optional(),
});

/**
 * Schema for getting events by email
 */
export const GetUserEventsByEmailParamsSchema = z.object({
  email: z.email().describe("User email address"),
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Maximum number of events to return"),
});

export const GetUserEventsByEmailResponseSchema = z.object({
  events: z.array(EventRecordSchema),
});

/**
 * Schema for getting events by userId
 */
export const GetUserEventsByUserIdParamsSchema = z.object({
  userId: z.string().min(1).describe("User ID to get events for"),
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Maximum number of events to return (default: 20)"),
});

export const GetUserEventsByUserIdResponseSchema = z.object({
  events: z.array(EventRecordSchema),
});

// Type exports
export type BulkEvent = z.infer<typeof BulkEventSchema>;
export type FailedEventUpdates = z.infer<typeof FailedEventUpdatesSchema>;
export type BulkTrackResponse = z.infer<typeof BulkTrackResponseSchema>;
export type GetUserEventsByEmailParams = z.infer<
  typeof GetUserEventsByEmailParamsSchema
>;
export type GetUserEventsByEmailResponse = z.infer<
  typeof GetUserEventsByEmailResponseSchema
>;
export type GetUserEventsByUserIdParams = z.infer<
  typeof GetUserEventsByUserIdParamsSchema
>;
export type GetUserEventsByUserIdResponse = z.infer<
  typeof GetUserEventsByUserIdResponseSchema
>;

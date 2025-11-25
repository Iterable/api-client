import { z } from "zod";

import { FlexibleTimestampSchema, IterableDateTimeSchema } from "./common.js";
import { EventRecordSchema } from "./events.js";

/**
 * User management schemas and types
 */

export const UserProfileSchema = z.object({
  email: z.email(),
  userId: z.string().optional(),
  dataFields: z.record(z.string(), z.any()).optional(),
  preferUserId: z.boolean().optional(),
  mergeNestedObjects: z.boolean().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateUserParams = z.infer<typeof UpdateUserParamsSchema>;

export const UserResponseSchema = z.object({
  user: z
    .object({
      email: z.string(),
      userId: z.string().optional(),
      dataFields: z.record(z.string(), z.any()).optional(),
      profileUpdatedAt: z.string().optional(),
    })
    .optional(), // user field is undefined when user not found
});

export type UserResponse = z.infer<typeof UserResponseSchema>;

export const GetUserByEmailParamsSchema = z.object({
  email: z.email().describe("Email address of the user to retrieve"),
});

export const UpdateUserParamsSchema = z
  .object({
    email: z.email().optional().describe("User email address"),
    userId: z.string().optional().describe("User ID (alternative to email)"),
    dataFields: z
      .record(z.string(), z.any())
      .optional()
      .describe("User data fields to update"),
    mergeNestedObjects: z
      .boolean()
      .optional()
      .describe("Merge top-level objects instead of overwriting them"),
    createNewFields: z
      .boolean()
      .optional()
      .describe(
        "Whether new fields should be ingested and added to the schema"
      ),
    preferUserId: z
      .boolean()
      .optional()
      .describe(
        "Whether to create new user if userId doesn't exist (email-based projects only)"
      ),
  })
  .refine(
    (data) => data.email || data.userId,
    "Either email or userId must be provided"
  );

export const GetUserByIdParamsSchema = z.object({
  userId: z.string().describe("User ID to retrieve"),
});

export const BulkUpdateUsersParamsSchema = z.object({
  users: z
    .array(
      z.object({
        email: z.email().optional().describe("User email"),
        userId: z
          .string()
          .optional()
          .describe("User ID (alternative to email)"),
        dataFields: z
          .record(z.string(), z.any())
          .optional()
          .describe("User data fields to update"),
        mergeNestedObjects: z
          .boolean()
          .optional()
          .describe("Whether to merge nested objects"),
      })
    )
    .describe("Array of users to update"),
});

export const DeleteUserByEmailParamsSchema = z.object({
  email: z.email().describe("Email address of the user to delete"),
});

export const DeleteUserByUserIdParamsSchema = z.object({
  userId: z.string().describe("User ID of the user to delete"),
});

export const UserEventsResponseSchema = z.object({
  events: z.array(z.record(z.string(), z.any())),
});

export const SentMessageSchema = z.object({
  messageId: z.string(),
  campaignId: z.number(),
  templateId: z.number().optional(),
  campaignName: z.string().optional(),
  templateName: z.string().optional(),
  messageMedium: z.enum(["Email", "Push", "InApp", "SMS"]),
  status: z.string(),
  sentAt: FlexibleTimestampSchema, // API returns various formats
  createdAt: FlexibleTimestampSchema.optional(), // API returns various formats
  updatedAt: FlexibleTimestampSchema.optional(), // API returns various formats
  dataFields: z.record(z.string(), z.any()).optional(),
});

export const GetSentMessagesResponseSchema = z.object({
  messages: z.array(SentMessageSchema),
  totalCount: z.number().optional(),
});

export const GetSentMessagesParamsSchema = z
  .object({
    email: z.email().optional().describe("User email address"),
    userId: z.string().optional().describe("User ID (alternative to email)"),
    limit: z
      .number()
      .min(1)
      .max(1000)
      .optional()
      .describe(
        "Maximum number of messages to return (default: 10, max: 1000)"
      ),
    campaignIds: z
      .array(z.number())
      .optional()
      .describe("Only include messages from these campaigns"),
    startDateTime: IterableDateTimeSchema.optional().describe(
      "Start date time (yyyy-MM-dd HH:mm:ss ZZ)"
    ),
    endDateTime: IterableDateTimeSchema.optional().describe(
      "End date time (yyyy-MM-dd HH:mm:ss ZZ)"
    ),
    excludeBlastCampaigns: z
      .boolean()
      .optional()
      .describe("Exclude results from blast campaigns"),
    messageMedium: z
      .enum(["Email", "Push", "InApp", "SMS"])
      .optional()
      .describe("Only include messages of this type"),
  })
  .refine(
    (data) => data.email || data.userId,
    "Either email or userId must be provided"
  )
  .describe("Parameters for getting messages sent to a user");

export const GetUserFieldsResponseSchema = z
  .object({
    fields: z.record(z.string(), z.string()), // Field names map to field types as strings
  })
  .passthrough();

export type GetUserFieldsResponse = z.infer<typeof GetUserFieldsResponseSchema>;

export type UserEvent = z.infer<typeof EventRecordSchema>;
export type SentMessage = z.infer<typeof SentMessageSchema>;
export type GetSentMessagesResponse = z.infer<
  typeof GetSentMessagesResponseSchema
>;
export type GetSentMessagesParams = z.infer<typeof GetSentMessagesParamsSchema>;
export type BulkUpdateUsersParams = z.infer<typeof BulkUpdateUsersParamsSchema>;

/**
 * Schema for updating user email address
 * Only use with email-based projects. For userId/hybrid projects, use updateUser instead.
 */
export const UpdateEmailParamsSchema = z
  .object({
    currentEmail: z
      .email()
      .optional()
      .describe(
        "An email address that identifies a user profile in Iterable. Provide a currentEmail or a currentUserId (but not both), depending on how your project identifies users."
      ),
    currentUserId: z
      .string()
      .optional()
      .describe(
        "A user ID that identifies a user profile in Iterable. Provide a currentEmail or a currentUserId (but not both), depending on how your project identifies users."
      ),
    newEmail: z
      .email()
      .describe("The new email address to assign to the specified user."),
  })
  .refine(
    (data) => data.currentEmail || data.currentUserId,
    "Either currentEmail or currentUserId must be provided"
  );

export type UpdateEmailParams = z.infer<typeof UpdateEmailParamsSchema>;

/**
 * Schema for updating user subscriptions
 * IMPORTANT: This endpoint overwrites (does not merge) existing data for any non-null fields specified.
 */
export const UpdateUserSubscriptionsParamsSchema = z
  .object({
    email: z
      .email()
      .optional()
      .describe(
        "An email address that identifies a user profile in Iterable. For each user in your request, provide an email or a userId (but not both), depending on how your project identifies users."
      ),
    userId: z
      .string()
      .optional()
      .describe(
        "A user ID that identifies a user profile in Iterable. For each user in your request, provide an email or a userId (but not both), depending on how your project identifies users."
      ),
    emailListIds: z
      .array(z.number())
      .optional()
      .describe("Lists that a user is subscribed to"),
    subscribedMessageTypeIds: z
      .array(z.number())
      .optional()
      .describe(
        "Individual message type IDs to subscribe (does not impact channel subscriptions). To set a value for this field, first have your CSM enable the opt-in message types feature. Otherwise, attempting to set this field causes an error."
      ),
    unsubscribedChannelIds: z
      .array(z.number())
      .optional()
      .describe("Email channel ids to unsubscribe from"),
    unsubscribedMessageTypeIds: z
      .array(z.number())
      .optional()
      .describe(
        "Individual message type IDs to unsubscribe (does not impact channel subscriptions)."
      ),
    campaignId: z
      .number()
      .optional()
      .describe("Campaign to attribute unsubscribes"),
    templateId: z
      .number()
      .optional()
      .describe("Template to attribute unsubscribes"),
    validateChannelAlignment: z
      .boolean()
      .optional()
      .describe(
        "Defaults to true (validation enabled). When false, allows subscribing users to message types that belong to unsubscribed channels. By default, Iterable validates that subscribed message types belong to subscribed channels. Setting this to false bypasses this validation, allowing you to save message type preferences even when the parent channel is unsubscribed. Users won't receive messages from these types while the channel remains unsubscribed, but their preferences are preserved for when the channel becomes subscribed."
      ),
  })
  .refine(
    (data) => data.email || data.userId,
    "Either email or userId must be provided"
  );

export type UpdateUserSubscriptionsParams = z.infer<
  typeof UpdateUserSubscriptionsParamsSchema
>;

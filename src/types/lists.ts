import { z } from "zod";

import { UnixTimestampSchema } from "./common.js";

/**
 * List management schemas and types
 */

export const ListSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  listType: z.enum(["Standard", "Dynamic", "Suppression", "Internal"]),
  createdAt: UnixTimestampSchema, // API docs: "format": "int32"
  isGlobalSuppressionEnabled: z
    .boolean()
    .optional()
    .describe(
      "Indicates if the suppression list is global. This field is only present for lists where listType is Suppression. true indicates a global suppression list; false indicates a standard suppression list."
    ),
});

export type List = z.infer<typeof ListSchema>;

// Response schemas
export const GetListsResponseSchema = z.object({
  lists: z.array(ListSchema),
});

export const CreateListResponseSchema = z.object({
  listId: z.number(),
});

export const ListUserSchema = z.object({
  email: z.string(),
  userId: z.string().optional(),
  dataFields: z.record(z.string(), z.unknown()).optional(),
});

export const GetListUsersResponseSchema = z.object({
  users: z.array(ListUserSchema),
});

export type GetListsResponse = z.infer<typeof GetListsResponseSchema>;
export type CreateListResponse = z.infer<typeof CreateListResponseSchema>;
export type ListUser = z.infer<typeof ListUserSchema>;
export type GetListUsersResponse = z.infer<typeof GetListUsersResponseSchema>;

export const GetListsParamsSchema = z.object({
  listType: z
    .enum(["Static", "Dynamic"])
    .optional()
    .describe("Filter by list type"),
});

export const SubscribeToListParamsSchema = z.object({
  listId: z.number().describe("ID of the list to subscribe to"),
  subscribers: z
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
          .describe("Additional user data fields"),
        mergeNestedObjects: z
          .boolean()
          .optional()
          .describe("Merge top-level objects instead of overwriting them"),
        preferUserId: z
          .boolean()
          .optional()
          .describe(
            "Whether to create new user if userId doesn't exist (email-based projects only)"
          ),
      })
    )
    .describe("Array of users to subscribe"),
  updateExistingUsersOnly: z
    .boolean()
    .optional()
    .describe("Skip operation for unknown userIds/emails when true"),
});

export const GetListUsersParamsSchema = z.object({
  listId: z.number().describe("List ID to get users from"),
  maxResults: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Maximum number of users to return"),
});

export const CreateListParamsSchema = z.object({
  name: z.string().describe("Name of the list to create"),
  description: z.string().optional().describe("Description of the list"),
});

export const DeleteListParamsSchema = z.object({
  listId: z.number().describe("ID of the list to delete"),
});

export const UnsubscribeFromListParamsSchema = z.object({
  listId: z.number().describe("List ID to unsubscribe from"),
  subscribers: z
    .array(
      z.object({
        email: z.email().optional().describe("User email"),
        userId: z
          .string()
          .optional()
          .describe("User ID (alternative to email)"),
      })
    )
    .describe("Users to unsubscribe"),
});

export const ListsResponseSchema = z.object({
  lists: z.array(ListSchema),
});

export const GetListSizeParamsSchema = z
  .object({
    listId: z.number().describe("List ID to get size for"),
  })
  .describe("Parameters for getting list size");

export const GetListSizeResponseSchema = z.object({
  size: z.number(),
});

export const GetListPreviewUsersParamsSchema = z
  .object({
    listId: z.number().describe("List ID to preview users from"),
    preferUserId: z
      .boolean()
      .optional()
      .describe("Return userId instead of email when both exist"),
    size: z
      .number()
      .min(1)
      .max(5000)
      .optional()
      .describe("Number of users to return (max 5000, default 1000)"),
  })
  .describe("Parameters for previewing users in a list");

export const GetListPreviewUsersResponseSchema = z.object({
  users: z.array(z.string()),
});

// Response schemas based on API specification
export const FailedUserUpdatesSchema = z.object({
  invalidEmails: z.array(z.string()).optional(),
  invalidUserIds: z.array(z.string()).optional(),
  failedEmails: z.array(z.string()).optional(),
  failedUserIds: z.array(z.string()).optional(),
});

export const UserBulkUpdateListResponseSchema = z.object({
  successCount: z.number(),
  failCount: z.number(),
  createdFields: z.array(z.string()).optional(),
  filteredOutFields: z.array(z.string()).optional(),
  failedUpdates: FailedUserUpdatesSchema.optional(),
  // Deprecated fields but still present in API
  invalidEmails: z.array(z.string()).optional(),
  invalidUserIds: z.array(z.string()).optional(),
});

// Type exports
export type GetListsParams = z.infer<typeof GetListsParamsSchema>;
export type SubscribeToListParams = z.infer<typeof SubscribeToListParamsSchema>;
export type UnsubscribeFromListParams = z.infer<
  typeof UnsubscribeFromListParamsSchema
>;
export type GetListUsersParams = z.infer<typeof GetListUsersParamsSchema>;
export type CreateListParams = z.infer<typeof CreateListParamsSchema>;
export type DeleteListParams = z.infer<typeof DeleteListParamsSchema>;
export type GetListSizeParams = z.infer<typeof GetListSizeParamsSchema>;
export type GetListSizeResponse = z.infer<typeof GetListSizeResponseSchema>;
export type GetListPreviewUsersParams = z.infer<
  typeof GetListPreviewUsersParamsSchema
>;
export type GetListPreviewUsersResponse = z.infer<
  typeof GetListPreviewUsersResponseSchema
>;
export type FailedUserUpdates = z.infer<typeof FailedUserUpdatesSchema>;
export type UserBulkUpdateListResponse = z.infer<
  typeof UserBulkUpdateListResponseSchema
>;

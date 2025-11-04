import { z } from "zod";

import { IterableDateTimeSchema, UnixTimestampSchema } from "./common.js";

/**
 * Messaging schemas and types for all communication channels
 * Includes channels, message types, and messaging operations
 */

export const ChannelSchema = z.object({
  id: z.number(),
  name: z.string(),
  channelType: z.string(),
  messageMedium: z.string(),
});

export const ChannelsResponseSchema = z.object({
  channels: z.array(ChannelSchema),
});

export type Channel = z.infer<typeof ChannelSchema>;
export type ChannelsResponse = z.infer<typeof ChannelsResponseSchema>;

export const MessageTypeSchema = z.object({
  id: z.number(),
  name: z.string(),
  channelId: z.number(),
  subscriptionPolicy: z.string().optional(),
  rateLimitPerMinute: z.number().optional(),
});

export const MessageTypesResponseSchema = z.object({
  messageTypes: z.array(MessageTypeSchema),
});

export type MessageType = z.infer<typeof MessageTypeSchema>;
export type MessageTypesResponse = z.infer<typeof MessageTypesResponseSchema>;

export const GetChannelsParamsSchema = z
  .object({})
  .describe("No parameters required for getting channels");

export const GetMessageTypesParamsSchema = z
  .object({})
  .describe("No parameters required for getting message types");

export type GetChannelsParams = z.infer<typeof GetChannelsParamsSchema>;
export type GetMessageTypesParams = z.infer<typeof GetMessageTypesParamsSchema>;

export const SendEmailParamsSchema = z
  .object({
    campaignId: z.number().describe("Campaign ID to send"),
    recipientEmail: z.email().optional().describe("Recipient email address"),
    recipientUserId: z
      .string()
      .optional()
      .describe("Recipient user ID (alternative to email)"),
    dataFields: z
      .record(z.string(), z.any())
      .optional()
      .describe("Data fields for email personalization"),
    sendAt: IterableDateTimeSchema.optional().describe(
      "When to send the email (YYYY-MM-DD HH:MM:SS format)"
    ),
    allowRepeatMarketingSends: z
      .boolean()
      .optional()
      .describe("Allow repeat marketing sends"),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe("Additional metadata"),
  })
  .refine(
    (data) => data.recipientEmail || data.recipientUserId,
    "Either recipientEmail or recipientUserId must be provided"
  );

export const CancelEmailParamsSchema = z.object({
  campaignId: z.number().optional().describe("Campaign ID to cancel"),
  email: z
    .email()
    .optional()
    .describe("Email address that identifies a user profile"),
  userId: z
    .string()
    .optional()
    .describe("User ID that identifies a user profile"),
  scheduledMessageId: z
    .number()
    .optional()
    .describe("Scheduled message ID to cancel"),
});

export const CancelSMSParamsSchema = z.object({
  campaignId: z.number().optional().describe("Campaign ID to cancel"),
  email: z
    .email()
    .optional()
    .describe("Email address that identifies a user profile"),
  userId: z
    .string()
    .optional()
    .describe("User ID that identifies a user profile"),
  scheduledMessageId: z
    .number()
    .optional()
    .describe("Scheduled message ID to cancel"),
});

export const CancelPushParamsSchema = z.object({
  campaignId: z.number().optional().describe("Campaign ID to cancel"),
  email: z
    .email()
    .optional()
    .describe("Email address that identifies a user profile"),
  userId: z
    .string()
    .optional()
    .describe("User ID that identifies a user profile"),
  scheduledMessageId: z
    .number()
    .optional()
    .describe("Scheduled message ID to cancel"),
});

export const CancelWebPushParamsSchema = z.object({
  campaignId: z.number().optional().describe("Campaign ID to cancel"),
  email: z
    .email()
    .optional()
    .describe("Email address that identifies a user profile"),
  userId: z
    .string()
    .optional()
    .describe("User ID that identifies a user profile"),
  scheduledMessageId: z
    .number()
    .optional()
    .describe("Scheduled message ID to cancel"),
});

export const CancelWhatsAppParamsSchema = z.object({
  campaignId: z.number().optional().describe("Campaign ID to cancel"),
  email: z
    .email()
    .optional()
    .describe("Email address that identifies a user profile"),
  userId: z
    .string()
    .optional()
    .describe("User ID that identifies a user profile"),
  scheduledMessageId: z
    .number()
    .optional()
    .describe("Scheduled message ID to cancel"),
});

export const CancelInAppParamsSchema = z.object({
  campaignId: z.number().optional().describe("Campaign ID to cancel"),
  email: z
    .email()
    .optional()
    .describe("Email address that identifies a user profile"),
  userId: z
    .string()
    .optional()
    .describe("User ID that identifies a user profile"),
  scheduledMessageId: z
    .number()
    .optional()
    .describe("Scheduled message ID to cancel"),
});

// SMS messaging
export const SendSMSParamsSchema = z
  .object({
    campaignId: z.number().describe("Campaign ID to send"),
    recipientEmail: z.email().optional().describe("Recipient email address"),
    recipientPhone: z.string().optional().describe("Recipient phone number"),
    recipientUserId: z.string().optional().describe("Recipient user ID"),
    dataFields: z
      .record(z.string(), z.any())
      .optional()
      .describe("Data fields for personalization"),
    sendAt: IterableDateTimeSchema.optional().describe(
      "When to send (YYYY-MM-DD HH:MM:SS format)"
    ),
    allowRepeatMarketingSends: z
      .boolean()
      .optional()
      .describe("Allow repeat marketing sends"),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe("Additional metadata"),
  })
  .refine(
    (data) =>
      data.recipientEmail || data.recipientUserId || data.recipientPhone,
    "Either recipientEmail, recipientUserId, or recipientPhone must be provided"
  );

// WhatsApp messaging
export const SendWhatsAppParamsSchema = z
  .object({
    campaignId: z.number().describe("Campaign ID to send"),
    recipientEmail: z.email().optional().describe("Recipient email address"),
    recipientPhone: z.string().optional().describe("Recipient phone number"),
    recipientUserId: z.string().optional().describe("Recipient user ID"),
    dataFields: z
      .record(z.string(), z.any())
      .optional()
      .describe("Data fields for personalization"),
    sendAt: IterableDateTimeSchema.optional().describe(
      "When to send (YYYY-MM-DD HH:MM:SS format)"
    ),
    allowRepeatMarketingSends: z
      .boolean()
      .optional()
      .describe("Allow repeat marketing sends"),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe("Additional metadata"),
  })
  .refine(
    (data) =>
      data.recipientEmail || data.recipientUserId || data.recipientPhone,
    "Either recipientEmail, recipientUserId, or recipientPhone must be provided"
  );

// Web Push messaging
export const SendWebPushParamsSchema = z
  .object({
    campaignId: z.number().describe("Campaign ID to send"),
    recipientEmail: z.email().optional().describe("Recipient email address"),
    recipientUserId: z.string().optional().describe("Recipient user ID"),
    dataFields: z
      .record(z.string(), z.any())
      .optional()
      .describe("Data fields for personalization"),
    sendAt: IterableDateTimeSchema.optional().describe(
      "When to send (YYYY-MM-DD HH:MM:SS format)"
    ),
    allowRepeatMarketingSends: z
      .boolean()
      .optional()
      .describe("Allow repeat marketing sends"),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe("Additional metadata"),
  })
  .refine(
    (data) => data.recipientEmail || data.recipientUserId,
    "Either recipientEmail or recipientUserId must be provided"
  );

// Push notification messaging
export const SendPushParamsSchema = z
  .object({
    campaignId: z.number().describe("Campaign ID to send"),
    recipientEmail: z.email().optional().describe("Recipient email address"),
    recipientUserId: z.string().optional().describe("Recipient user ID"),
    dataFields: z
      .record(z.string(), z.any())
      .optional()
      .describe("Data fields for personalization"),
    sendAt: IterableDateTimeSchema.optional().describe(
      "When to send (YYYY-MM-DD HH:MM:SS format)"
    ),
    allowRepeatMarketingSends: z
      .boolean()
      .optional()
      .describe("Allow repeat marketing sends"),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe("Additional metadata"),
  })
  .refine(
    (data) => data.recipientEmail || data.recipientUserId,
    "Either recipientEmail or recipientUserId must be provided"
  );

// In-App messaging
export const InAppMessageSchema = z.object({
  messageId: z.string(),
  campaignId: z.number(),
  content: z.object({
    html: z.string().optional(),
    payload: z.record(z.string(), z.any()).optional(),
  }),
  trigger: z.object({
    type: z.string(),
  }),
  createdAt: UnixTimestampSchema, // API docs: "format": "int64"
  expiresAt: z.number().optional(),
  saveToInbox: z.boolean().optional(),
  inboxMetadata: z.record(z.string(), z.any()).optional(),
  customPayload: z.record(z.string(), z.any()).optional(),
});

export const GetInAppMessagesParamsSchema = z
  .object({
    email: z.email().optional().describe("User email address"),
    userId: z.string().optional().describe("User ID (alternative to email)"),
    count: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe("Number of messages to retrieve"),
    platform: z
      .enum(["iOS", "Android", "Web"])
      .optional()
      .describe("Platform filter"),
  })
  .refine(
    (data) => data.email || data.userId,
    "Either email or userId must be provided"
  );

export const SendInAppParamsSchema = z
  .object({
    campaignId: z.number().describe("Campaign ID to send"),
    recipientEmail: z.email().optional().describe("Recipient email address"),
    recipientUserId: z
      .string()
      .optional()
      .describe("Recipient user ID (alternative to email)"),
    dataFields: z
      .record(z.string(), z.any())
      .optional()
      .describe("Data fields for personalization"),
    sendAt: IterableDateTimeSchema.optional().describe(
      "When to send (YYYY-MM-DD HH:MM:SS format)"
    ),
    allowRepeatMarketingSends: z
      .boolean()
      .optional()
      .describe("Allow repeat marketing sends"),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe("Additional metadata"),
  })
  .refine(
    (data) => data.recipientEmail || data.recipientUserId,
    "Either recipientEmail or recipientUserId must be provided"
  );

// Embedded messaging schemas
export const GetEmbeddedMessagesParamsSchema = z
  .object({
    email: z.email().optional().describe("User email address"),
    userId: z.string().optional().describe("User ID (alternative to email)"),
    platform: z
      .string()
      .optional()
      .describe("Platform: iOS, Android, or Web (case-sensitive)"),
    sdkVersion: z
      .string()
      .optional()
      .describe("Iterable SDK version (e.g., 6.5.0)"),
    packageName: z.string().optional().describe("Package name of the app"),
    placementIds: z
      .array(z.number())
      .optional()
      .describe("Placements to include in response"),
    currentMessageIds: z
      .array(z.string())
      .optional()
      .describe("IDs of embedded messages already retrieved"),
  })
  .refine(
    (data) => data.email || data.userId,
    "Either email or userId must be provided"
  );

// Response schemas
export const InAppMessagesResponseSchema = z.object({
  inAppMessages: z.array(InAppMessageSchema),
});

export const ApiInAppMessagesResponseSchema = z.object({
  inAppMessages: z.array(InAppMessageSchema), // API returns array of InAppMessage objects
});

export const EmbeddedMessagesResponseSchema = z.object({
  placements: z.record(z.string(), z.any()), // Grouped by placementId with complex structure
});

// Type exports
export type SendEmailParams = z.infer<typeof SendEmailParamsSchema>;
export type CancelEmailParams = z.infer<typeof CancelEmailParamsSchema>;
export type SendSMSParams = z.infer<typeof SendSMSParamsSchema>;
export type CancelSMSParams = z.infer<typeof CancelSMSParamsSchema>;
export type SendWhatsAppParams = z.infer<typeof SendWhatsAppParamsSchema>;
export type CancelWhatsAppParams = z.infer<typeof CancelWhatsAppParamsSchema>;
export type SendWebPushParams = z.infer<typeof SendWebPushParamsSchema>;
export type CancelWebPushParams = z.infer<typeof CancelWebPushParamsSchema>;
export type SendPushParams = z.infer<typeof SendPushParamsSchema>;
export type CancelPushParams = z.infer<typeof CancelPushParamsSchema>;
export type SendInAppParams = z.infer<typeof SendInAppParamsSchema>;
export type CancelInAppParams = z.infer<typeof CancelInAppParamsSchema>;
export type GetInAppMessagesParams = z.infer<
  typeof GetInAppMessagesParamsSchema
>;
export type GetInAppMessagesResponse = z.infer<
  typeof ApiInAppMessagesResponseSchema
>;

// Alias for the response schema used in client
export const GetInAppMessagesResponseSchema = ApiInAppMessagesResponseSchema;
export type InAppMessage = z.infer<typeof InAppMessageSchema>;

export type GetEmbeddedMessagesParams = z.infer<
  typeof GetEmbeddedMessagesParamsSchema
>;
export type ApiInAppMessagesResponse = z.infer<
  typeof ApiInAppMessagesResponseSchema
>;
export type EmbeddedMessagesResponse = z.infer<
  typeof EmbeddedMessagesResponseSchema
>;

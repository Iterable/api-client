import { z } from "zod";

import { IterableDateTimeSchema, UnixTimestampSchema } from "./common.js";

/**
 * Template management schemas and types
 */

// Base template schema with common fields across all template types
const BaseTemplateSchema = z.object({
  templateId: z.number().describe("Template ID"),
  name: z.string().describe("Name of the template"),
  campaignId: z.number().optional().describe("Campaign ID"),
  clientTemplateId: z
    .string()
    .optional()
    .describe(
      "Client template ID. Used as a secondary key to reference the template"
    ),
  creatorUserId: z.string().optional().describe("Creator email"),
  messageTypeId: z.number().optional().describe("Message type ID"),
  locale: z
    .string()
    .optional()
    .describe(
      "The locale for the content in this request. Leave empty for default locale"
    ),
  isDefaultLocale: z
    .boolean()
    .optional()
    .describe(
      "Identifies if the locale associated with the response is the template's default"
    ),

  // Read-only timestamp fields (only present in some responses)
  createdAt: UnixTimestampSchema.optional().describe("Date created"),
  updatedAt: UnixTimestampSchema.optional().describe("Date last updated"),
});

export const EmailTemplateSchema = BaseTemplateSchema.extend({
  bccEmails: z.array(z.string()).optional().describe("BCC emails"),
  cacheDataFeed: z
    .boolean()
    .optional()
    .describe("Cache data feed lookups for 1 hour"),
  campaignDataFields: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Campaign-level data fields available as {{field}} merge parameters during message rendering. These fields have higher priority than project-level fields but lower priority than user/event data."
    ),
  ccEmails: z.array(z.string()).optional().describe("CC emails"),
  dataFeedId: z
    .number()
    .optional()
    .describe(
      "[Deprecated - use dataFeedIds instead] Id for data feed used in template rendering"
    ),
  dataFeedIds: z
    .array(z.number())
    .optional()
    .describe("Ids for data feeds used in template rendering"),
  fromEmail: z
    .string()
    .optional()
    .describe("From email (must be an authorized sender)"),
  fromName: z.string().optional().describe("From name"),
  googleAnalyticsCampaignName: z
    .string()
    .optional()
    .describe("Google analytics utm_campaign value"),
  html: z.string().optional().describe("HTML contents"),
  linkParams: z
    .array(z.any())
    .optional()
    .describe("Parameters to append to each URL in html contents"),
  mergeDataFeedContext: z
    .boolean()
    .optional()
    .describe(
      "Merge data feed contents into user context, so fields be referenced by {{field}} instead of [[field]]"
    ),
  metadata: z.any().optional().describe("Metadata"),
  plainText: z.string().optional().describe("Plain text contents"),
  preheaderText: z.string().optional().describe("Preheader text"),
  replyToEmail: z.string().optional().describe("Reply to email"),
  subject: z.string().optional().describe("Subject"),
});

export const SMSTemplateSchema = BaseTemplateSchema.extend({
  campaignDataFields: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Campaign-level data fields available as {{field}} merge parameters during message rendering. These fields have higher priority than project-level fields but lower priority than user/event data."
    ),
  googleAnalyticsCampaignName: z
    .string()
    .optional()
    .describe("Google analytics utm_campaign value"),
  imageUrl: z.string().optional().describe("Image Url"),
  linkParams: z
    .array(z.any())
    .optional()
    .describe("Parameters to append to each URL in contents"),
  message: z.string().optional().describe("SMS message"),
  trackingDomain: z.string().optional().describe("Tracking Domain"),
});

export const PushTemplateSchema = BaseTemplateSchema.extend({
  badge: z.string().optional().describe("Badge to set for push notification"),
  buttons: z
    .array(z.any())
    .optional()
    .describe("Array of buttons that appear to respond to the push. Max of 3"),
  cacheDataFeed: z
    .boolean()
    .optional()
    .describe("Cache data feed lookups for 1 hour"),
  campaignDataFields: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Campaign-level data fields available as {{field}} merge parameters during message rendering. These fields have higher priority than project-level fields but lower priority than user/event data."
    ),
  dataFeedIds: z
    .array(z.number())
    .optional()
    .describe("Ids for data feeds used in template rendering"),
  deeplink: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Deep Link. A mapping that accepts two optional properties: 'ios' & 'android' and their respective deep link values"
    ),
  interruptionLevel: z
    .string()
    .optional()
    .describe(
      "An interruption level helps iOS determine when to alert a user about the arrival of a push notification"
    ),
  isSilentPush: z
    .boolean()
    .optional()
    .describe("Whether or not this is a silent push notification template"),
  mergeDataFeedContext: z
    .boolean()
    .optional()
    .describe(
      "Merge data feed contents into user context, so fields can be referenced by {{field}} instead of [[field]]"
    ),
  message: z.string().optional().describe("Push message"),
  payload: z
    .record(z.string(), z.any())
    .optional()
    .describe("Payload to send with push notification"),
  relevanceScore: z
    .number()
    .optional()
    .describe(
      "Relevance score for iOS notifications on iOS 15+. Number is clamped between 0 and 1.0"
    ),
  richMedia: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Rich Media URL. A mapping that accepts two optional properties: 'ios' & 'android' and their respective rich media url values"
    ),
  sound: z.string().optional().describe("Sound"),
  title: z.string().optional().describe("Push message title"),
  wake: z
    .boolean()
    .optional()
    .describe(
      "Set the content-available flag on iOS notifications, which will wake the app in the background"
    ),
});

export const InAppTemplateSchema = BaseTemplateSchema.extend({
  campaignDataFields: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Campaign-level data fields available as {{field}} merge parameters during message rendering. These fields have higher priority than project-level fields but lower priority than user/event data."
    ),
  expirationDateTime: z
    .string()
    .optional()
    .describe(
      "The in-app message's absolute expiration time. Format is YYYY-MM-DD HH:MM:SS (UTC timestamp, time zones not allowed)"
    ),
  expirationDuration: z
    .string()
    .optional()
    .describe(
      "The in-app message's expiration time, relative to its send time. Should be an expression such as now+90d"
    ),
  html: z.string().optional().describe("Html of the in-app notification"),
  inAppDisplaySettings: z
    .record(z.string(), z.any())
    .optional()
    .describe("Display settings"),
  inboxMetadata: z
    .record(z.string(), z.any())
    .optional()
    .describe("Title, subtitle, and thumbnail"),
  payload: z.record(z.string(), z.any()).optional().describe("Payload"),
  webInAppDisplaySettings: z
    .record(z.string(), z.any())
    .optional()
    .describe("Web In-app Display settings"),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;
export type SMSTemplate = z.infer<typeof SMSTemplateSchema>;
export type PushTemplate = z.infer<typeof PushTemplateSchema>;
export type InAppTemplate = z.infer<typeof InAppTemplateSchema>;

export const CreateTemplateResponseSchema = BaseTemplateSchema.extend({
  createdAt: UnixTimestampSchema.describe("Date created (Unix timestamp)"), // API returns epoch milliseconds
  updatedAt: UnixTimestampSchema.describe("Date last updated (Unix timestamp)"), // API returns epoch milliseconds
  creatorUserId: z.string().describe("Creator email"),
  messageTypeId: z.number().describe("Message type ID"),
});

export type CreateTemplateResponse = z.infer<
  typeof CreateTemplateResponseSchema
>;

// ApiTemplateResponse schema based on API docs - for getTemplates endpoint
export const ApiTemplateResponseSchema = z.object({
  templateId: z.number().describe("Template ID"),
  name: z.string().describe("Name of the template"),
  createdAt: UnixTimestampSchema.describe("Date created (Unix timestamp)"), // API returns Unix timestamp
  updatedAt: UnixTimestampSchema.describe("Date last updated (Unix timestamp)"), // API returns Unix timestamp
  creatorUserId: z.string().describe("Creator email"),
  messageTypeId: z.number().describe("Message type ID"),
  // Optional fields
  campaignId: z.number().optional().describe("Campaign ID"),
  clientTemplateId: z
    .string()
    .optional()
    .describe(
      "Client template ID. Used as a secondary key to reference the template"
    ),
});

export type ApiTemplateResponse = z.infer<typeof ApiTemplateResponseSchema>;

export const GetTemplatesResponseSchema = z.object({
  templates: z.array(ApiTemplateResponseSchema),
});

export type GetTemplatesResponse = z.infer<typeof GetTemplatesResponseSchema>;

export const GetTemplatesParamsSchema = z.object({
  templateType: z
    .enum(["Base", "Blast", "Triggered", "Workflow"])
    .optional()
    .describe("Filter by template type"),
  messageMedium: z
    .enum(["Email", "Push", "InApp", "SMS"])
    .optional()
    .describe("Filter by message medium"),
  startDateTime: IterableDateTimeSchema.optional().describe(
    "Get templates created at or after this date time (yyyy-MM-dd HH:mm:ss [ZZ])"
  ),
  endDateTime: IterableDateTimeSchema.optional().describe(
    "Get templates created before this date time (yyyy-MM-dd HH:mm:ss [ZZ])"
  ),
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Maximum number of templates to return"),
});

export const GetTemplateParamsSchema = z.object({
  templateId: z.number().describe("Template ID to retrieve"),
  locale: z.string().optional().describe("Locale of content to get"),
});

export const GetTemplateByClientIdParamsSchema = z.object({
  clientTemplateId: z
    .string()
    .describe("Client template ID to look up template by"),
});

export const GetTemplateByClientIdResponseSchema = z.object({
  templates: z.array(
    z.object({
      templateId: z.number().describe("Template ID"),
      campaignId: z.number().optional().describe("Campaign ID"),
      locales: z
        .array(z.string())
        .describe("Available locales for this template"),
    })
  ),
});

export type GetTemplateByClientIdResponse = z.infer<
  typeof GetTemplateByClientIdResponseSchema
>;

// Shared fields across all template types
const BaseTemplateParamsSchema = z.object({
  name: z.string().optional().describe("Template name"),
  locale: z.string().optional().describe("Template locale"),
  messageTypeId: z.number().optional().describe("Message type ID"),
  creatorUserId: z.string().optional().describe("Creator user ID"),
  campaignId: z.number().optional().describe("Associated campaign ID"),
});

// Base schema for upsert operations (create/update by clientTemplateId)
const UpsertTemplateParamsSchema = BaseTemplateParamsSchema.extend({
  clientTemplateId: z.string().describe("Client template ID"), // Only field required by API
});

// Base schema for update operations (modify existing by templateId)
const UpdateTemplateParamsSchema = BaseTemplateParamsSchema.extend({
  templateId: z.number().describe("Template ID to update"),
});

// Content field objects for each template type
const EmailContentFields = {
  subject: z.string().optional().describe("Email subject"),
  fromName: z.string().optional().describe("From name"),
  fromEmail: z.email().optional().describe("From email"),
  html: z.string().optional().describe("HTML content"),
  plainText: z.string().optional().describe("Plain text content"),
  campaignDataFields: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Campaign-level data fields available as {{field}} merge parameters during message rendering. These fields have higher priority than project-level fields but lower priority than user/event data."
    ),
};

const SMSContentFields = {
  message: z.string().optional().describe("SMS message content"),
  campaignDataFields: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Campaign-level data fields available as {{field}} merge parameters during message rendering. These fields have higher priority than project-level fields but lower priority than user/event data."
    ),
};

const PushContentFields = {
  message: z.string().optional().describe("Push notification message"),
  title: z.string().optional().describe("Push notification title"),
  badge: z.number().optional().describe("Badge count"),
  sound: z.string().optional().describe("Sound file"),
  payload: z.record(z.string(), z.any()).optional().describe("Custom payload"),
  campaignDataFields: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Campaign-level data fields available as {{field}} merge parameters during message rendering. These fields have higher priority than project-level fields but lower priority than user/event data."
    ),
};

const InAppContentFields = {
  html: z
    .string()
    .optional()
    .describe("HTML content of the in-app notification"),
  campaignDataFields: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Campaign-level data fields available as {{field}} merge parameters during message rendering. These fields have higher priority than project-level fields but lower priority than user/event data."
    ),
};

// Email template upsert (create or update by clientTemplateId)
export const UpsertEmailTemplateParamsSchema =
  UpsertTemplateParamsSchema.extend(EmailContentFields);

// Email template update (modify existing by templateId)
export const UpdateEmailTemplateParamsSchema =
  UpdateTemplateParamsSchema.extend(EmailContentFields);

// SMS templates
export const UpsertSMSTemplateParamsSchema =
  UpsertTemplateParamsSchema.extend(SMSContentFields);

export const UpdateSMSTemplateParamsSchema =
  UpdateTemplateParamsSchema.extend(SMSContentFields);

// Push templates
export const UpsertPushTemplateParamsSchema =
  UpsertTemplateParamsSchema.extend(PushContentFields);

export const UpdatePushTemplateParamsSchema =
  UpdateTemplateParamsSchema.extend(PushContentFields);

// InApp templates
export const UpsertInAppTemplateParamsSchema =
  UpsertTemplateParamsSchema.extend(InAppContentFields);

export const UpdateInAppTemplateParamsSchema =
  UpdateTemplateParamsSchema.extend(InAppContentFields);

// Type exports
export type GetTemplatesParams = z.infer<typeof GetTemplatesParamsSchema>;
export type GetTemplateParams = z.infer<typeof GetTemplateParamsSchema>;
export type GetTemplateByClientIdParams = z.infer<
  typeof GetTemplateByClientIdParamsSchema
>;
export type UpsertEmailTemplateParams = z.infer<
  typeof UpsertEmailTemplateParamsSchema
>;
export type UpdateEmailTemplateParams = z.infer<
  typeof UpdateEmailTemplateParamsSchema
>;
export type UpsertSMSTemplateParams = z.infer<
  typeof UpsertSMSTemplateParamsSchema
>;
export type UpdateSMSTemplateParams = z.infer<
  typeof UpdateSMSTemplateParamsSchema
>;
export type UpsertPushTemplateParams = z.infer<
  typeof UpsertPushTemplateParamsSchema
>;
export type UpdatePushTemplateParams = z.infer<
  typeof UpdatePushTemplateParamsSchema
>;
export type UpsertInAppTemplateParams = z.infer<
  typeof UpsertInAppTemplateParamsSchema
>;
export type UpdateInAppTemplateParams = z.infer<
  typeof UpdateInAppTemplateParamsSchema
>;

// Delete template schemas
export const DeleteTemplateParamsSchema = z.object({
  templateId: z.number().positive().describe("Template ID to delete"),
});

export const BulkDeleteTemplatesParamsSchema = z.object({
  ids: z.array(z.number()).describe("IDs of templates to delete"),
});

export type DeleteTemplateParams = z.infer<typeof DeleteTemplateParamsSchema>;
export type BulkDeleteTemplatesParams = z.infer<
  typeof BulkDeleteTemplatesParamsSchema
>;

export const BulkDeleteTemplatesResponseSchema = z.object({
  success: z.array(z.number()).describe("Successfully deleted template IDs"),
  failed: z.array(z.number()).describe("Failed to delete template IDs"),
  failureReason: z.string().optional().describe("Reason for failures"),
});

export type BulkDeleteTemplatesResponse = z.infer<
  typeof BulkDeleteTemplatesResponseSchema
>;

// Template proof schemas
export const TemplateProofRequestSchema = z
  .object({
    templateId: z.number().describe("Template ID to send proof for"),
    recipientEmail: z
      .email()
      .optional()
      .describe(
        "An email address that identifies a user profile in Iterable. Provide a recipientEmail or a recipientUserId (but not both), depending on how your project identifies users."
      ),
    recipientUserId: z
      .string()
      .optional()
      .describe(
        "A user ID that identifies a user profile in Iterable. Provide a recipientEmail or a recipientUserId (but not both), depending on how your project identifies users."
      ),
    dataFields: z
      .record(z.string(), z.any())
      .optional()
      .describe("Fields to merge into template for proof"),
    locale: z
      .string()
      .optional()
      .describe(
        "Locale for the proof message. If provided, must be a valid locale for the project. If not provided, falls back to the user's locale, then to the project's default locale."
      ),
  })
  .refine((data) => data.recipientEmail || data.recipientUserId, {
    message: "Either recipientEmail or recipientUserId must be provided",
    path: ["recipientEmail", "recipientUserId"],
  });

export type TemplateProofRequest = z.infer<typeof TemplateProofRequestSchema>;

// Template preview schemas
export const TemplatePreviewRequestSchema = z.object({
  dataFields: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Data fields for template rendering. Provide key-value pairs for any user profile, event, or custom fields that your template references. Note: Fields are accessible as {{fieldName}} in templates."
    ),
  dataFeed: z
    .record(z.string(), z.any())
    .optional()
    .describe(
      "Data feed content for template rendering. Provide key-value pairs for any data feed fields that your template references. Note: Data feed fields are accessible as [[fieldName]] when template's mergeDataFeedContext=false, or as {{fieldName}} when mergeDataFeedContext=true. The mergeDataFeedContext setting is configured when creating/updating templates. If fetchDataFeeds is true, this will be merged with (or overridden by) the fetched data feed data."
    ),
  fetchDataFeeds: z
    .boolean()
    .optional()
    .describe(
      "Whether to fetch and use actual data feeds configured in the template. If true, the data feeds associated with the template will be fetched and used for rendering. Data from dataFields will be used to render dynamic URLs in the data feed configuration. If dataFeed is also provided, it will be merged with (or override) the fetched data feed data. Defaults to false."
    ),
});

export type TemplatePreviewRequest = z.infer<
  typeof TemplatePreviewRequestSchema
>;

export const PreviewTemplateParamsSchema = z.object({
  templateId: z.number().describe("Template ID"),
  locale: z.string().optional().describe("Locale of content to get"),
  data: TemplatePreviewRequestSchema.optional().describe(
    "Data to use for template rendering"
  ),
});

export type PreviewTemplateParams = z.infer<typeof PreviewTemplateParamsSchema>;

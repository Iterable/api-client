import { z } from "zod";

/**
 * Webhook management schemas and types
 */

// API webhook response schema based on specification
export const WebhookSchema = z.object({
  id: z.number(),
  authType: z.string(),
  blastSendEnabled: z.boolean(),
  enabled: z.boolean(),
  endpoint: z.string(),
  triggeredSendEnabled: z.boolean(),
  channelIds: z.array(z.number()).optional(),
  messageTypeIds: z.array(z.number()).optional(),
});

export type Webhook = z.infer<typeof WebhookSchema>;

// Response schemas
export const GetWebhooksResponseSchema = z.object({
  webhooks: z.array(WebhookSchema),
});

export type GetWebhooksResponse = z.infer<typeof GetWebhooksResponseSchema>;
export type GetWebhooksParams = z.infer<typeof GetWebhooksParamsSchema>;
export type UpdateWebhookParams = z.infer<typeof UpdateWebhookParamsSchema>;

export const GetWebhooksParamsSchema = z.object({
  random_string: z.string().describe("Dummy parameter for no-parameter tools"),
});

export const UpdateWebhookParamsSchema = z.object({
  webhookId: z.number().describe("Webhook ID to update"),
  url: z.url().optional().describe("Webhook URL"),
  events: z.array(z.string()).optional().describe("Events to subscribe to"),
  active: z.boolean().optional().describe("Whether webhook is active"),
});

export const WebhooksResponseSchema = z.object({
  webhooks: z.array(WebhookSchema),
});

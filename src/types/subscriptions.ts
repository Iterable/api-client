import { z } from "zod";
export const SubscriptionGroupSchema = z
  .enum(["emailList", "messageType", "messageChannel"])
  .describe("Type of subscription group");

export type SubscriptionGroup = z.infer<typeof SubscriptionGroupSchema>;

export const BulkUpdateSubscriptionsParamsSchema = z.object({
  subscriptionGroup: SubscriptionGroupSchema,
  subscriptionGroupId: z.number().describe("Subscription Group Id"),
  action: z
    .enum(["subscribe", "unsubscribe"])
    .describe("Action to perform: subscribe or unsubscribe"),
  users: z
    .array(z.email())
    .optional()
    .describe("Users to subscribe/unsubscribe, identified by email"),
  usersByUserId: z
    .array(z.string())
    .optional()
    .describe("Users to subscribe/unsubscribe, identified by userId"),
});

export type BulkUpdateSubscriptionsParams = z.infer<
  typeof BulkUpdateSubscriptionsParamsSchema
>;

export const SubscribeUserByEmailParamsSchema = z.object({
  subscriptionGroup: SubscriptionGroupSchema,
  subscriptionGroupId: z.number().describe("Subscription Group Id"),
  userEmail: z.email().describe("User's email address"),
});

export type SubscribeUserByEmailParams = z.infer<
  typeof SubscribeUserByEmailParamsSchema
>;

export const SubscribeUserByUserIdParamsSchema = z.object({
  subscriptionGroup: SubscriptionGroupSchema,
  subscriptionGroupId: z.number().describe("Subscription Group Id"),
  userId: z.string().describe("User's userId"),
});

export type SubscribeUserByUserIdParams = z.infer<
  typeof SubscribeUserByUserIdParamsSchema
>;

export const UnsubscribeUserByEmailParamsSchema = z.object({
  subscriptionGroup: SubscriptionGroupSchema,
  subscriptionGroupId: z.number().describe("Subscription Group Id"),
  userEmail: z.email().describe("User's email address"),
});

export type UnsubscribeUserByEmailParams = z.infer<
  typeof UnsubscribeUserByEmailParamsSchema
>;

export const UnsubscribeUserByUserIdParamsSchema = z.object({
  subscriptionGroup: SubscriptionGroupSchema,
  subscriptionGroupId: z.number().describe("Subscription Group Id"),
  userId: z.string().describe("User's userId"),
});

export type UnsubscribeUserByUserIdParams = z.infer<
  typeof UnsubscribeUserByUserIdParamsSchema
>;

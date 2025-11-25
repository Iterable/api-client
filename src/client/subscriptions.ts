import {
  IterableSuccessResponse,
  IterableSuccessResponseSchema,
} from "../types/common.js";
import {
  BulkUpdateSubscriptionsParams,
  SubscribeUserByEmailParams,
  SubscribeUserByUserIdParams,
  UnsubscribeUserByEmailParams,
  UnsubscribeUserByUserIdParams,
} from "../types/subscriptions.js";
import type { BaseIterableClient, Constructor } from "./base.js";

export function Subscriptions<T extends Constructor<BaseIterableClient>>(
  Base: T
) {
  return class extends Base {
    async bulkUpdateSubscriptions(
      params: BulkUpdateSubscriptionsParams
    ): Promise<IterableSuccessResponse> {
      const {
        subscriptionGroup,
        subscriptionGroupId,
        action,
        users,
        usersByUserId,
      } = params;

      const requestBody = { users, usersByUserId };

      const response = await this.client.put(
        `/api/subscriptions/${encodeURIComponent(subscriptionGroup)}/${subscriptionGroupId}?action=${action}`,
        requestBody
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async subscribeUserByEmail(
      params: SubscribeUserByEmailParams
    ): Promise<IterableSuccessResponse> {
      const { subscriptionGroup, subscriptionGroupId, userEmail } = params;

      const response = await this.client.patch(
        `/api/subscriptions/${encodeURIComponent(subscriptionGroup)}/${subscriptionGroupId}/user/${encodeURIComponent(userEmail)}`
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async subscribeUserByUserId(
      params: SubscribeUserByUserIdParams
    ): Promise<IterableSuccessResponse> {
      const { subscriptionGroup, subscriptionGroupId, userId } = params;

      const response = await this.client.patch(
        `/api/subscriptions/${encodeURIComponent(subscriptionGroup)}/${subscriptionGroupId}/byUserId/${encodeURIComponent(userId)}`
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async unsubscribeUserByEmail(
      params: UnsubscribeUserByEmailParams
    ): Promise<IterableSuccessResponse> {
      const { subscriptionGroup, subscriptionGroupId, userEmail } = params;

      const response = await this.client.delete(
        `/api/subscriptions/${encodeURIComponent(subscriptionGroup)}/${subscriptionGroupId}/user/${encodeURIComponent(userEmail)}`
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async unsubscribeUserByUserId(
      params: UnsubscribeUserByUserIdParams
    ): Promise<IterableSuccessResponse> {
      const { subscriptionGroup, subscriptionGroupId, userId } = params;

      const response = await this.client.delete(
        `/api/subscriptions/${encodeURIComponent(subscriptionGroup)}/${subscriptionGroupId}/byUserId/${encodeURIComponent(userId)}`
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }
  };
}

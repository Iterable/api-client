import { IterableSuccessResponse } from "../types/common.js";
import {
  BulkUpdateSubscriptionsParams,
  SubscribeUserByEmailParams,
  SubscribeUserByUserIdParams,
  UnsubscribeUserByEmailParams,
  UnsubscribeUserByUserIdParams,
} from "../types/subscriptions.js";
import type { Constructor } from "./base.js";
import type { BaseIterableClient } from "./base.js";

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
      return response.data;
    }

    async subscribeUserByEmail(
      params: SubscribeUserByEmailParams
    ): Promise<IterableSuccessResponse> {
      const { subscriptionGroup, subscriptionGroupId, userEmail } = params;

      const response = await this.client.patch(
        `/api/subscriptions/${encodeURIComponent(subscriptionGroup)}/${subscriptionGroupId}/user/${encodeURIComponent(userEmail)}`
      );
      return response.data;
    }

    async subscribeUserByUserId(
      params: SubscribeUserByUserIdParams
    ): Promise<IterableSuccessResponse> {
      const { subscriptionGroup, subscriptionGroupId, userId } = params;

      const response = await this.client.patch(
        `/api/subscriptions/${encodeURIComponent(subscriptionGroup)}/${subscriptionGroupId}/byUserId/${encodeURIComponent(userId)}`
      );
      return response.data;
    }

    async unsubscribeUserByEmail(
      params: UnsubscribeUserByEmailParams
    ): Promise<IterableSuccessResponse> {
      const { subscriptionGroup, subscriptionGroupId, userEmail } = params;

      const response = await this.client.delete(
        `/api/subscriptions/${encodeURIComponent(subscriptionGroup)}/${subscriptionGroupId}/user/${encodeURIComponent(userEmail)}`
      );
      return response.data;
    }

    async unsubscribeUserByUserId(
      params: UnsubscribeUserByUserIdParams
    ): Promise<IterableSuccessResponse> {
      const { subscriptionGroup, subscriptionGroupId, userId } = params;

      const response = await this.client.delete(
        `/api/subscriptions/${encodeURIComponent(subscriptionGroup)}/${subscriptionGroupId}/byUserId/${encodeURIComponent(userId)}`
      );
      return response.data;
    }
  };
}

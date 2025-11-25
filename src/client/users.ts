import {
  IterableSuccessResponse,
  IterableSuccessResponseSchema,
} from "../types/common.js";
import {
  UserBulkUpdateListResponse,
  UserBulkUpdateListResponseSchema,
} from "../types/lists.js";
import {
  BulkUpdateUsersParams,
  GetSentMessagesParams,
  GetSentMessagesResponse,
  GetSentMessagesResponseSchema,
  GetUserFieldsResponse,
  GetUserFieldsResponseSchema,
  UpdateEmailParams,
  UpdateUserParams,
  UpdateUserSubscriptionsParams,
  UserResponse,
  UserResponseSchema,
} from "../types/users.js";
import type { BaseIterableClient, Constructor } from "./base.js";

/**
 * User management operations mixin
 */
export function Users<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    /**
     * Get a user by email address
     */
    async getUserByEmail(
      email: string,
      opts?: { signal?: AbortSignal }
    ): Promise<UserResponse> {
      const response = await this.client.get(
        `/api/users/${encodeURIComponent(email)}`,
        opts?.signal ? { signal: opts.signal } : {}
      );
      return this.validateResponse(response, UserResponseSchema);
    }

    /**
     * Get a user by userId
     */
    async getUserByUserId(
      userId: string,
      opts?: { signal?: AbortSignal }
    ): Promise<UserResponse> {
      const response = await this.client.get(
        `/api/users/byUserId/${encodeURIComponent(userId)}`,
        opts?.signal ? { signal: opts.signal } : {}
      );
      return this.validateResponse(response, UserResponseSchema);
    }

    /**
     * Update user data or add a user if none exists
     * Accepts email OR userId in the userProfile parameter
     */
    async updateUser(
      userProfile: UpdateUserParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/users/update", userProfile);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Delete a user by email address
     * Asynchronous operation - does not prevent future data collection
     */
    async deleteUserByEmail(email: string): Promise<IterableSuccessResponse> {
      const response = await this.client.delete(
        `/api/users/${encodeURIComponent(email)}`
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Delete a user by userId
     * Asynchronous operation - does not prevent future data collection
     * If multiple users share the same userId, they'll all be deleted
     */
    async deleteUserByUserId(userId: string): Promise<IterableSuccessResponse> {
      const response = await this.client.delete(
        `/api/users/byUserId/${encodeURIComponent(userId)}`
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Update a user's email address
     * Only use with email-based projects. For userId/hybrid projects, use updateUser instead.
     * Returns an error if the new email already exists or has been forgotten via GDPR.
     */
    async updateEmail(
      params: UpdateEmailParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/users/updateEmail", params);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Update user subscriptions
     * IMPORTANT: This endpoint overwrites (does not merge) existing data for any non-null fields specified.
     */
    async updateUserSubscriptions(
      params: UpdateUserSubscriptionsParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post(
        "/api/users/updateSubscriptions",
        params
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Bulk update user data
     */
    async bulkUpdateUsers(
      params: BulkUpdateUsersParams
    ): Promise<UserBulkUpdateListResponse> {
      const response = await this.client.post("/api/users/bulkUpdate", params);
      return this.validateResponse(response, UserBulkUpdateListResponseSchema);
    }

    /**
     * Get messages sent to a user
     */
    async getSentMessages(
      params: GetSentMessagesParams
    ): Promise<GetSentMessagesResponse> {
      const queryParams = new URLSearchParams();

      if (params.email) {
        queryParams.append("email", params.email);
      }
      if (params.userId) {
        queryParams.append("userId", params.userId);
      }
      if (params.limit !== undefined) {
        queryParams.append("limit", params.limit.toString());
      }
      if (params.campaignIds && params.campaignIds.length > 0) {
        params.campaignIds.forEach((id) =>
          queryParams.append("campaignIds", id.toString())
        );
      }
      if (params.startDateTime) {
        queryParams.append("startDateTime", params.startDateTime);
      }
      if (params.endDateTime) {
        queryParams.append("endDateTime", params.endDateTime);
      }
      if (params.excludeBlastCampaigns !== undefined) {
        queryParams.append(
          "excludeBlastCampaigns",
          params.excludeBlastCampaigns.toString()
        );
      }
      if (params.messageMedium) {
        queryParams.append("messageMedium", params.messageMedium);
      }

      const response = await this.client.get(
        `/api/users/getSentMessages?${queryParams.toString()}`
      );
      return this.validateResponse(response, GetSentMessagesResponseSchema);
    }

    /**
     * Get all user profile field definitions
     */
    async getUserFields(): Promise<GetUserFieldsResponse> {
      const response = await this.client.get("/api/users/getFields");
      return this.validateResponse(response, GetUserFieldsResponseSchema);
    }
  };
}

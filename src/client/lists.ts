import {
  IterableSuccessResponse,
  IterableSuccessResponseSchema,
} from "../types/common.js";
import {
  CreateListParams,
  CreateListResponse,
  CreateListResponseSchema,
  GetListPreviewUsersParams,
  GetListPreviewUsersResponse,
  GetListPreviewUsersResponseSchema,
  GetListSizeParams,
  GetListSizeResponse,
  GetListSizeResponseSchema,
  GetListsResponse,
  GetListsResponseSchema,
  GetListUsersParams,
  GetListUsersResponse,
  GetListUsersResponseSchema,
  SubscribeToListParams,
  UnsubscribeFromListParams,
  UserBulkUpdateListResponse,
  UserBulkUpdateListResponseSchema,
} from "../types/lists.js";
import type { BaseIterableClient, Constructor } from "./base.js";

/**
 * Lists operations mixin
 */
export function Lists<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    async getLists(): Promise<GetListsResponse> {
      const response = await this.client.get("/api/lists");
      return this.validateResponse(response, GetListsResponseSchema);
    }

    async subscribeUserToList(
      options: SubscribeToListParams
    ): Promise<UserBulkUpdateListResponse> {
      const response = await this.client.post("/api/lists/subscribe", options);
      return this.validateResponse(response, UserBulkUpdateListResponseSchema);
    }

    async unsubscribeUserFromList(
      options: UnsubscribeFromListParams
    ): Promise<UserBulkUpdateListResponse> {
      const response = await this.client.post(
        "/api/lists/unsubscribe",
        options
      );
      return this.validateResponse(response, UserBulkUpdateListResponseSchema);
    }

    async getListUsers(
      options: GetListUsersParams,
      opts?: { signal?: AbortSignal }
    ): Promise<GetListUsersResponse> {
      const params = new URLSearchParams();
      params.append("listId", options.listId.toString());
      if (options.maxResults)
        params.append("maxResults", options.maxResults.toString());

      const response = await this.client.get(
        `/api/lists/getUsers?${params.toString()}`,
        opts?.signal ? { signal: opts.signal } : {}
      );

      // The API returns newline-delimited email addresses as plain text
      const responseData = response.data;
      if (typeof responseData === "string") {
        const emails = responseData
          .trim()
          .split("\n")
          .filter((email) => email.trim());
        const result = {
          users: emails.map((email) => ({ email: email.trim() })),
        };
        // Validate the constructed response
        return this.validateResponse(
          { data: result },
          GetListUsersResponseSchema
        );
      }

      // Fallback to original format if it's already JSON
      return this.validateResponse(response, GetListUsersResponseSchema);
    }

    async createList(options: CreateListParams): Promise<CreateListResponse> {
      const response = await this.client.post("/api/lists", options);
      return this.validateResponse(response, CreateListResponseSchema);
    }

    async deleteList(listId: number): Promise<IterableSuccessResponse> {
      const response = await this.client.delete(`/api/lists/${listId}`);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Get the count of users in a list
     */
    async getListSize(params: GetListSizeParams): Promise<GetListSizeResponse> {
      const response = await this.client.get(
        `/api/lists/${params.listId}/size`
      );
      // API returns a string number, convert to proper object and validate
      const size = parseInt(response.data, 10);
      return this.validateResponse(
        { data: { size } },
        GetListSizeResponseSchema
      );
    }

    /**
     * Preview users in a list (up to 5000 users)
     */
    async getListPreviewUsers(
      params: GetListPreviewUsersParams
    ): Promise<GetListPreviewUsersResponse> {
      const queryParams = new URLSearchParams();
      queryParams.append("listId", params.listId.toString());

      if (params.preferUserId !== undefined) {
        queryParams.append("preferUserId", params.preferUserId.toString());
      }
      if (params.size !== undefined) {
        queryParams.append("size", params.size.toString());
      }

      const response = await this.client.get(
        `/api/lists/previewUsers?${queryParams.toString()}`
      );

      // API returns plain text with users separated by newlines
      const responseData = response.data;
      if (typeof responseData === "string") {
        const users = responseData
          .trim()
          .split("\n")
          .filter((user) => user.length > 0);
        return this.validateResponse(
          { data: { users } },
          GetListPreviewUsersResponseSchema
        );
      }

      // Fallback to JSON validation if response is not plain text
      return this.validateResponse(response, GetListPreviewUsersResponseSchema);
    }
  };
}

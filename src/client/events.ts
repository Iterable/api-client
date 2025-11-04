import { IterableSuccessResponse } from "../types/common.js";
import { IterableSuccessResponseSchema } from "../types/common.js";
import {
  BulkTrackResponse,
  BulkTrackResponseSchema,
  GetUserEventsByEmailParams,
  GetUserEventsByEmailResponse,
  GetUserEventsByEmailResponseSchema,
  GetUserEventsByUserIdParams,
  GetUserEventsByUserIdResponse,
  GetUserEventsByUserIdResponseSchema,
  TrackBulkEventsParams,
  TrackEventParams,
} from "../types/events.js";
import type { Constructor } from "./base.js";
import type { BaseIterableClient } from "./base.js";

/**
 * Events operations mixin
 */
export function Events<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    async trackEvent(
      event: TrackEventParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/events/track", event);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async trackBulkEvents(
      params: TrackBulkEventsParams
    ): Promise<BulkTrackResponse> {
      const response = await this.client.post("/api/events/trackBulk", params);
      return this.validateResponse(response, BulkTrackResponseSchema);
    }

    /**
     * Get events for a user by email
     */
    async getUserEventsByEmail(
      options: GetUserEventsByEmailParams,
      opts?: { signal?: AbortSignal }
    ): Promise<GetUserEventsByEmailResponse> {
      const params = new URLSearchParams();
      if (options.limit) params.append("limit", options.limit.toString());

      const response = await this.client.get(
        `/api/events/${encodeURIComponent(options.email)}${params.toString() ? `?${params.toString()}` : ""}`,
        opts?.signal ? { signal: opts.signal } : {}
      );
      return this.validateResponse(
        response,
        GetUserEventsByEmailResponseSchema
      );
    }

    /**
     * Get events for a user by userId
     */
    async getUserEventsByUserId(
      options: GetUserEventsByUserIdParams,
      opts?: { signal?: AbortSignal }
    ): Promise<GetUserEventsByUserIdResponse> {
      const params = new URLSearchParams();
      if (options.limit) params.append("limit", options.limit.toString());

      const response = await this.client.get(
        `/api/events/byUserId/${encodeURIComponent(options.userId)}${params.toString() ? `?${params.toString()}` : ""}`,
        opts?.signal ? { signal: opts.signal } : {}
      );
      return this.validateResponse(
        response,
        GetUserEventsByUserIdResponseSchema
      );
    }
  };
}

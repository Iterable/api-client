import {
  GetWebhooksResponse,
  GetWebhooksResponseSchema,
  UpdateWebhookParams,
  Webhook,
  WebhookSchema,
} from "../types/webhooks.js";
import type { Constructor } from "./base.js";
import type { BaseIterableClient } from "./base.js";

/**
 * Webhooks operations mixin
 */
export function Webhooks<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    async getWebhooks(): Promise<GetWebhooksResponse> {
      const response = await this.client.get("/api/webhooks");
      return this.validateResponse(response, GetWebhooksResponseSchema);
    }

    async updateWebhook(options: UpdateWebhookParams): Promise<Webhook> {
      const response = await this.client.post("/api/webhooks", options);
      return this.validateResponse(response, WebhookSchema);
    }

    // NOTE: Webhook creation/deletion not supported by Iterable REST API
    // Based on swagger documentation at https://api.iterable.com/api-docs
    // Only GET (retrieve) and POST (update) operations are available for webhooks
  };
}

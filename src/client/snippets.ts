import {
  CreateSnippetRequest,
  CreateSnippetResponse,
  CreateSnippetResponseSchema,
  DeleteSnippetParams,
  DeleteSnippetResponse,
  DeleteSnippetResponseSchema,
  GetSnippetParams,
  GetSnippetResponse,
  GetSnippetResponseSchema,
  GetSnippetsResponse,
  GetSnippetsResponseSchema,
  UpdateSnippetParams,
  UpdateSnippetRequest,
  UpdateSnippetResponse,
  UpdateSnippetResponseSchema,
} from "../types/snippets.js";
import type { BaseIterableClient, Constructor } from "./base.js";

/**
 * Snippets operations mixin
 */
export function Snippets<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    async getSnippets(opts?: {
      signal?: AbortSignal;
    }): Promise<GetSnippetsResponse> {
      const response = await this.client.get(
        "/api/snippets",
        opts?.signal ? { signal: opts.signal } : {}
      );
      return this.validateResponse(response, GetSnippetsResponseSchema);
    }

    async createSnippet(
      params: CreateSnippetRequest,
      opts?: { signal?: AbortSignal }
    ): Promise<CreateSnippetResponse> {
      const response = await this.client.post("/api/snippets", params, opts);
      return this.validateResponse(response, CreateSnippetResponseSchema);
    }

    async getSnippet(
      params: GetSnippetParams,
      opts?: { signal?: AbortSignal }
    ): Promise<GetSnippetResponse> {
      const response = await this.client.get(
        `/api/snippets/${params.identifier}`,
        opts?.signal ? { signal: opts.signal } : {}
      );
      return this.validateResponse(response, GetSnippetResponseSchema);
    }

    async updateSnippet(
      params: UpdateSnippetParams,
      body: UpdateSnippetRequest,
      opts?: { signal?: AbortSignal }
    ): Promise<UpdateSnippetResponse> {
      const response = await this.client.put(
        `/api/snippets/${params.identifier}`,
        body,
        opts
      );
      return this.validateResponse(response, UpdateSnippetResponseSchema);
    }

    async deleteSnippet(
      params: DeleteSnippetParams,
      opts?: { signal?: AbortSignal }
    ): Promise<DeleteSnippetResponse> {
      const response = await this.client.delete(
        `/api/snippets/${params.identifier}`,
        opts?.signal ? { signal: opts.signal } : {}
      );
      return this.validateResponse(response, DeleteSnippetResponseSchema);
    }
  };
}

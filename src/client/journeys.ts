import {
  formatSortParam,
  IterableSuccessResponse,
  IterableSuccessResponseSchema,
} from "../types/common.js";
import {
  GetJourneysParams,
  GetJourneysResponse,
  GetJourneysResponseSchema,
  TriggerJourneyParams,
} from "../types/journeys.js";
import type { BaseIterableClient, Constructor } from "./base.js";

/**
 * Journeys operations mixin
 */
export function Journeys<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    async triggerJourney(
      options: TriggerJourneyParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post(
        "/api/workflows/triggerWorkflow",
        options
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async getJourneys(
      params?: GetJourneysParams
    ): Promise<GetJourneysResponse> {
      // Always use pagination with defaults to ensure consistent API behavior
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 10;
      const sort = params?.sort;

      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("pageSize", pageSize.toString());

      const sortString = formatSortParam(sort);
      if (sortString) {
        queryParams.append("sort", sortString);
      }
      if (params?.state) {
        params.state.forEach((state) => queryParams.append("state", state));
      }

      const url = `/api/journeys?${queryParams.toString()}`;
      const response = await this.client.get(url);
      return this.validateResponse(response, GetJourneysResponseSchema);
    }
  };
}

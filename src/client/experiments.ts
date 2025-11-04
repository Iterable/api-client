import {
  ExperimentMetricsResponse,
  GetExperimentMetricsParams,
} from "../types/experiments.js";
import type { Constructor } from "./base.js";
import type { BaseIterableClient } from "./base.js";

/**
 * Experiments operations mixin
 */
export function Experiments<T extends Constructor<BaseIterableClient>>(
  Base: T
) {
  return class extends Base {
    async getExperimentMetrics(
      params?: GetExperimentMetricsParams
    ): Promise<ExperimentMetricsResponse> {
      const queryParams = new URLSearchParams();

      if (params?.experimentId && params.experimentId.length > 0) {
        params.experimentId.forEach((id) =>
          queryParams.append("experimentId", id.toString())
        );
      }
      if (params?.campaignId && params.campaignId.length > 0) {
        params.campaignId.forEach((id) =>
          queryParams.append("campaignId", id.toString())
        );
      }
      if (params?.startDateTime) {
        queryParams.append("startDateTime", params.startDateTime);
      }
      if (params?.endDateTime) {
        queryParams.append("endDateTime", params.endDateTime);
      }

      const url = `/api/experiments/metrics${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;
      const response = await this.client.get(url, {
        responseType: "text",
      });

      // Parse CSV response into array of objects
      return this.parseCsv(response.data);
    }
  };
}

import {
  ExperimentDetails,
  ExperimentDetailsSchema,
  ExperimentMetricsResponse,
  GetExperimentMetricsParams,
  GetExperimentParams,
  GetExperimentVariantsParams,
  GetExperimentVariantsResponse,
  GetExperimentVariantsResponseSchema,
  ListExperimentsParams,
  ListExperimentsResponse,
  ListExperimentsResponseSchema,
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
      return this.parseCsv(response);
    }

    async listExperiments(
      params?: ListExperimentsParams
    ): Promise<ListExperimentsResponse> {
      const queryParams = new URLSearchParams();

      if (params?.campaignId !== undefined) {
        queryParams.append("campaignId", params.campaignId.toString());
      }
      if (params?.status) {
        queryParams.append("state", params.status);
      }
      if (params?.startDate) {
        queryParams.append("startDateTime", params.startDate);
      }
      if (params?.endDate) {
        queryParams.append("endDateTime", params.endDate);
      }
      if (params?.limit !== undefined) {
        queryParams.append("limit", params.limit.toString());
      }
      if (params?.offset !== undefined) {
        queryParams.append("offset", params.offset.toString());
      }

      const url = `/api/experiments${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;
      const response = await this.client.get(url);

      return this.validateResponse(response, ListExperimentsResponseSchema);
    }

    async getExperiment(
      params: GetExperimentParams
    ): Promise<ExperimentDetails> {
      const url = `/api/experiments/${params.experimentId}`;
      const response = await this.client.get(url);

      return this.validateResponse(response, ExperimentDetailsSchema);
    }

    async getExperimentVariants(
      params: GetExperimentVariantsParams
    ): Promise<GetExperimentVariantsResponse> {
      const url = `/api/experiments/${params.experimentId}/variants`;
      const response = await this.client.get(url);

      return this.validateResponse(
        response,
        GetExperimentVariantsResponseSchema
      );
    }
  };
}

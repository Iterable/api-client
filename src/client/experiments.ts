import {
  CopyExperimentVariantParams,
  CreateExperimentParams,
  DeclareExperimentWinnerParams,
  ExperimentIdParams,
  ExperimentMetricsResponse,
  ExperimentResponse,
  ExperimentResponseSchema,
  ExperimentTotalsResponse,
  ExperimentTotalsResponseSchema,
  ExperimentTrendsResponse,
  ExperimentTrendsResponseSchema,
  GetExperimentMetricsParams,
  GetExperimentParams,
  GetExperimentTrendsParams,
  GetExperimentVariantsParams,
  GetExperimentVariantsResponse,
  GetExperimentVariantsResponseSchema,
  ListExperimentsParams,
  ListExperimentsResponse,
  ListExperimentsResponseSchema,
  UpdateExperimentSettingsParams,
} from "../types/experiments.js";
import type { Constructor } from "./base.js";
import type { BaseIterableClient } from "./base.js";
import { parseCsv, validateResponse } from "./base.js";

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
      return parseCsv(response);
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

      return validateResponse(response, ListExperimentsResponseSchema);
    }

    async getExperiment(
      params: GetExperimentParams
    ): Promise<ExperimentResponse> {
      const url = `/api/experiments/${params.experimentId}`;
      const response = await this.client.get(url);

      return validateResponse(response, ExperimentResponseSchema);
    }

    async getExperimentVariants(
      params: GetExperimentVariantsParams
    ): Promise<GetExperimentVariantsResponse> {
      const url = `/api/experiments/${params.experimentId}/variants`;
      const response = await this.client.get(url);

      return validateResponse(response, GetExperimentVariantsResponseSchema);
    }

    async getExperimentTotals(
      params: ExperimentIdParams
    ): Promise<ExperimentTotalsResponse> {
      const response = await this.client.get(
        `/api/experiments/${params.experimentId}/totals`
      );
      return validateResponse(response, ExperimentTotalsResponseSchema);
    }

    async getExperimentTrends(
      params: GetExperimentTrendsParams
    ): Promise<ExperimentTrendsResponse> {
      const queryParams = new URLSearchParams();
      if (params.startDateTime) {
        queryParams.append("startDateTime", params.startDateTime);
      }
      if (params.endDateTime) {
        queryParams.append("endDateTime", params.endDateTime);
      }
      const query = queryParams.toString();
      const response = await this.client.get(
        `/api/experiments/${params.experimentId}/trends${query ? `?${query}` : ""}`
      );
      return validateResponse(response, ExperimentTrendsResponseSchema);
    }

    async createExperiment(
      params: CreateExperimentParams
    ): Promise<ExperimentResponse> {
      const body: CreateExperimentParams = {
        campaignId: params.campaignId,
        experimentType: params.experimentType,
      };
      if (params.name !== undefined) {
        body.name = params.name;
      }

      const response = await this.client.post("/api/experiments", body);
      return validateResponse(response, ExperimentResponseSchema);
    }

    async copyExperimentVariant(
      params: CopyExperimentVariantParams
    ): Promise<ExperimentResponse> {
      const body: Omit<CopyExperimentVariantParams, "experimentId"> = {
        copyFromTemplateId: params.copyFromTemplateId,
      };
      if (params.name !== undefined) {
        body.name = params.name;
      }

      const response = await this.client.post(
        `/api/experiments/${params.experimentId}/variants`,
        body
      );
      return validateResponse(response, ExperimentResponseSchema);
    }

    async updateExperimentSettings(
      params: UpdateExperimentSettingsParams
    ): Promise<ExperimentResponse> {
      const body: Omit<UpdateExperimentSettingsParams, "experimentId"> = {};
      if (params.conversionEventSettings !== undefined) {
        body.conversionEventSettings = params.conversionEventSettings;
      }
      if (params.holdoutSettings !== undefined) {
        body.holdoutSettings = params.holdoutSettings;
      }
      if (params.explorationBlastSettings !== undefined) {
        body.explorationBlastSettings = params.explorationBlastSettings;
      }
      if (params.explorationTriggerSettings !== undefined) {
        body.explorationTriggerSettings = params.explorationTriggerSettings;
      }
      if (params.evenlySplitVariations !== undefined) {
        body.evenlySplitVariations = params.evenlySplitVariations;
      }

      const response = await this.client.patch(
        `/api/experiments/${params.experimentId}/settings`,
        body
      );
      return validateResponse(response, ExperimentResponseSchema);
    }

    async startExperiment(
      params: ExperimentIdParams
    ): Promise<ExperimentResponse> {
      const response = await this.client.post(
        `/api/experiments/${params.experimentId}/start`,
        {}
      );
      return validateResponse(response, ExperimentResponseSchema);
    }

    async cancelExperiment(
      params: ExperimentIdParams
    ): Promise<ExperimentResponse> {
      const response = await this.client.post(
        `/api/experiments/${params.experimentId}/cancel`,
        {}
      );
      return validateResponse(response, ExperimentResponseSchema);
    }

    async declareExperimentWinner(
      params: DeclareExperimentWinnerParams
    ): Promise<ExperimentResponse> {
      const { experimentId, variantId } = params;
      const response = await this.client.post(
        `/api/experiments/${experimentId}/winner`,
        { variantId }
      );
      return validateResponse(response, ExperimentResponseSchema);
    }

    async deleteExperiment(
      params: ExperimentIdParams
    ): Promise<ExperimentResponse> {
      const response = await this.client.post(
        `/api/experiments/${params.experimentId}/delete`,
        {}
      );
      return validateResponse(response, ExperimentResponseSchema);
    }
  };
}

import {
  AbortCampaignParams,
  ActivateTriggeredCampaignParams,
  ArchiveCampaignsParams,
  ArchiveCampaignsResponse,
  ArchiveCampaignsResponseSchema,
  CampaignMetricsResponse,
  CancelCampaignParams,
  CreateCampaignParams,
  CreateCampaignResponse,
  CreateCampaignResponseSchema,
  DeactivateTriggeredCampaignParams,
  GetCampaignMetricsParams,
  GetCampaignParams,
  GetCampaignResponse,
  GetCampaignResponseSchema,
  GetCampaignsParams,
  GetCampaignsResponse,
  GetCampaignsResponseSchema,
  GetChildCampaignsParams,
  GetChildCampaignsResponse,
  GetChildCampaignsResponseSchema,
  ScheduleCampaignParams,
  SendCampaignParams,
  TriggerCampaignParams,
} from "../types/campaigns.js";
import {
  formatSortParam,
  IterableSuccessResponse,
  IterableSuccessResponseSchema,
} from "../types/common.js";
import type { BaseIterableClient, Constructor } from "./base.js";

/**
 * Campaigns operations mixin
 */
export function Campaigns<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    async getCampaigns(
      params?: GetCampaignsParams,
      opts?: {
        signal?: AbortSignal;
      }
    ): Promise<GetCampaignsResponse> {
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

      const url = `/api/campaigns?${queryParams.toString()}`;
      const response = await this.client.get(
        url,
        opts?.signal ? { signal: opts.signal } : {}
      );
      return this.validateResponse(response, GetCampaignsResponseSchema);
    }

    async getCampaign(
      params: GetCampaignParams,
      opts?: { signal?: AbortSignal }
    ): Promise<GetCampaignResponse> {
      const response = await this.client.get(
        `/api/campaigns/${params.id}`,
        opts?.signal ? { signal: opts.signal } : {}
      );
      return this.validateResponse(response, GetCampaignResponseSchema);
    }

    async createCampaign(
      params: CreateCampaignParams
    ): Promise<CreateCampaignResponse> {
      const response = await this.client.post("/api/campaigns/create", params);
      return this.validateResponse(response, CreateCampaignResponseSchema);
    }

    async getChildCampaigns(
      params: GetChildCampaignsParams,
      opts?: {
        signal?: AbortSignal;
      }
    ): Promise<GetChildCampaignsResponse> {
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

      const url = `/api/campaigns/recurring/${params.id}/childCampaigns?${queryParams.toString()}`;
      const response = await this.client.get(
        url,
        opts?.signal ? { signal: opts.signal } : {}
      );
      return this.validateResponse(response, GetChildCampaignsResponseSchema);
    }

    async getCampaignMetrics(
      options: GetCampaignMetricsParams
    ): Promise<CampaignMetricsResponse> {
      const params = new URLSearchParams();
      params.append("campaignId", options.campaignId.toString());
      if (options.startDateTime)
        params.append("startDateTime", options.startDateTime);
      if (options.endDateTime)
        params.append("endDateTime", options.endDateTime);

      const response = await this.client.get(
        `/api/campaigns/metrics?${params.toString()}`,
        {
          responseType: "text",
        }
      );

      // Parse CSV response into array of objects
      return this.parseCsv(response);
    }

    async scheduleCampaign(
      params: ScheduleCampaignParams
    ): Promise<IterableSuccessResponse> {
      const { campaignId, ...scheduleParams } = params;
      const response = await this.client.post(
        `/api/campaigns/${campaignId}/schedule`,
        scheduleParams
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Abort a campaign
     * Stops a campaign that is currently running
     */
    async abortCampaign(
      params: AbortCampaignParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/campaigns/abort", params);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Cancel a scheduled or recurring campaign
     */
    async cancelCampaign(
      params: CancelCampaignParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/campaigns/cancel", params);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Activate a triggered campaign
     * Note: API triggered campaign activation must be enabled for your project
     */
    async activateTriggeredCampaign(
      params: ActivateTriggeredCampaignParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post(
        "/api/campaigns/activateTriggered",
        params
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Deactivate a triggered campaign
     * Note: API triggered campaign deactivation must be enabled for your project
     */
    async deactivateTriggeredCampaign(
      params: DeactivateTriggeredCampaignParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post(
        "/api/campaigns/deactivateTriggered",
        params
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Archive one or more campaigns
     * This behaves the same as the archive feature in the UI:
     * - Scheduled or recurring campaigns will be cancelled
     * - Running campaigns will be aborted
     * - Archived campaigns will be hidden from the Campaigns page but viewable in the Archived tab
     * Rate limit: 5 requests/second, per API key
     */
    async archiveCampaigns(
      params: ArchiveCampaignsParams
    ): Promise<ArchiveCampaignsResponse> {
      const response = await this.client.post("/api/campaigns/archive", params);
      return this.validateResponse(response, ArchiveCampaignsResponseSchema);
    }

    /**
     * Trigger a campaign to send to specified lists
     */
    async triggerCampaign(
      params: TriggerCampaignParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/campaigns/trigger", params);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Send an existing campaign immediately
     */
    async sendCampaign(
      params: SendCampaignParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post(
        `/api/campaigns/${params.campaignId}/send`
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }
  };
}

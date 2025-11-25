import {
  CancelExportJobParams,
  CancelExportJobResponse,
  CancelExportJobResponseSchema,
  GetExportFilesParams,
  GetExportFilesResponse,
  GetExportFilesResponseSchema,
  GetExportJobsParams,
  GetExportJobsResponse,
  GetExportJobsResponseSchema,
  StartExportJobParams,
  StartExportJobResponse,
  StartExportJobResponseSchema,
} from "../types/export.js";
import type { BaseIterableClient, Constructor } from "./base.js";

/**
 * Export operations mixin
 */
export function Export<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    async getExportJobs(
      params?: GetExportJobsParams
    ): Promise<GetExportJobsResponse> {
      const urlParams = new URLSearchParams();
      if (params?.jobState) urlParams.append("jobState", params.jobState);

      const response = await this.client.get(
        `/api/export/jobs?${urlParams.toString()}`
      );
      return this.validateResponse(response, GetExportJobsResponseSchema);
    }

    async getExportFiles(
      params: GetExportFilesParams
    ): Promise<GetExportFilesResponse> {
      const urlParams = new URLSearchParams();
      if (params.startAfter) urlParams.append("startAfter", params.startAfter);

      const response = await this.client.get(
        `/api/export/${params.jobId}/files?${urlParams.toString()}`
      );
      return this.validateResponse(response, GetExportFilesResponseSchema);
    }

    async startExportJob(
      params: StartExportJobParams
    ): Promise<StartExportJobResponse> {
      const response = await this.client.post("/api/export/start", params);
      return this.validateResponse(response, StartExportJobResponseSchema);
    }

    async cancelExportJob(
      params: CancelExportJobParams
    ): Promise<CancelExportJobResponse> {
      const response = await this.client.delete(`/api/export/${params.jobId}`);
      return this.validateResponse(response, CancelExportJobResponseSchema);
    }
  };
}

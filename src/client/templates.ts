import type { AxiosInstance } from "axios";
import { z } from "zod";

import {
  formatSortParam,
  IterableSuccessResponse,
  IterableSuccessResponseSchema,
} from "../types/common.js";
import {
  BulkDeleteTemplatesParams,
  BulkDeleteTemplatesResponse,
  BulkDeleteTemplatesResponseSchema,
  EmailTemplate,
  EmailTemplateSchema,
  GetTemplateByClientIdParams,
  GetTemplateByClientIdResponse,
  GetTemplateByClientIdResponseSchema,
  GetTemplateParams,
  GetTemplatesParams,
  GetTemplatesResponse,
  GetTemplatesResponseSchema,
  InAppTemplate,
  InAppTemplateSchema,
  PreviewTemplateParams,
  PushTemplate,
  PushTemplateSchema,
  SendTemplateProofParams,
  SMSTemplate,
  SMSTemplateSchema,
  UpdateEmailTemplateParams,
  UpdateInAppTemplateParams,
  UpdatePushTemplateParams,
  UpdateSMSTemplateParams,
  UpsertEmailTemplateParams,
  UpsertInAppTemplateParams,
  UpsertPushTemplateParams,
  UpsertSMSTemplateParams,
} from "../types/templates.js";
import type { BaseIterableClient, Constructor } from "./base.js";
import { validateResponse } from "./base.js";

async function getTemplateByType<T>(
  client: AxiosInstance,
  pathSegment: string,
  params: GetTemplateParams,
  schema: z.ZodSchema<T>
): Promise<T> {
  const queryParams = new URLSearchParams();
  queryParams.append("templateId", params.templateId.toString());
  if (params.locale) {
    queryParams.append("locale", params.locale);
  }

  const response = await client.get(
    `/api/templates/${pathSegment}/get?${queryParams.toString()}`
  );
  return validateResponse(response, schema);
}

async function createTemplateByType<T>(
  client: AxiosInstance,
  pathSegment: string,
  template: T
): Promise<IterableSuccessResponse> {
  const response = await client.post(
    `/api/templates/${pathSegment}/upsert`,
    template
  );
  return validateResponse(response, IterableSuccessResponseSchema);
}

async function updateTemplateByType<T>(
  client: AxiosInstance,
  pathSegment: string,
  options: T
): Promise<IterableSuccessResponse> {
  const response = await client.post(
    `/api/templates/${pathSegment}/update`,
    options
  );
  return validateResponse(response, IterableSuccessResponseSchema);
}

async function sendTemplateProof(
  client: AxiosInstance,
  pathSegment: string,
  request: SendTemplateProofParams
): Promise<IterableSuccessResponse> {
  const response = await client.post(
    `/api/templates/${pathSegment}/proof`,
    request
  );
  return validateResponse(response, IterableSuccessResponseSchema);
}

async function previewTemplate(
  client: AxiosInstance,
  pathSegment: string,
  params: PreviewTemplateParams
): Promise<string> {
  const queryParams = new URLSearchParams();
  queryParams.append("templateId", params.templateId.toString());
  if (params.locale) {
    queryParams.append("locale", params.locale);
  }

  const response = await client.post(
    `/api/templates/${pathSegment}/preview?${queryParams.toString()}`,
    params.data || {}
  );
  return validateResponse(response, z.string());
}

/**
 * Templates operations mixin
 */
export function Templates<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    async getTemplates(
      options?: GetTemplatesParams
    ): Promise<GetTemplatesResponse> {
      const page = options?.page ?? 1;
      const pageSize = options?.pageSize ?? 10;
      const sort = options?.sort;

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", pageSize.toString());

      const sortString = formatSortParam(sort);
      if (sortString) {
        params.append("sort", sortString);
      }

      if (options?.templateType)
        params.append("templateType", options.templateType);
      if (options?.messageMedium)
        params.append("messageMedium", options.messageMedium);
      if (options?.startDateTime)
        params.append("startDateTime", options.startDateTime);
      if (options?.endDateTime)
        params.append("endDateTime", options.endDateTime);

      const response = await this.client.get(
        `/api/templates?${params.toString()}`
      );
      return validateResponse(response, GetTemplatesResponseSchema);
    }

    async getTemplateByClientId(
      params: GetTemplateByClientIdParams
    ): Promise<GetTemplateByClientIdResponse> {
      const response = await this.client.get(
        "/api/templates/getByClientTemplateId",
        {
          params: { clientTemplateId: params.clientTemplateId },
        }
      );
      return validateResponse(response, GetTemplateByClientIdResponseSchema);
    }

    async bulkDeleteTemplates(
      params: BulkDeleteTemplatesParams
    ): Promise<BulkDeleteTemplatesResponse> {
      const response = await this.client.post(
        `/api/templates/bulkDelete`,
        params
      );
      return validateResponse(response, BulkDeleteTemplatesResponseSchema);
    }

    /**
     * Delete one or more templates by ID
     * @deprecated Use {@link bulkDeleteTemplates} instead
     */
    async deleteTemplates(
      params: BulkDeleteTemplatesParams
    ): Promise<BulkDeleteTemplatesResponse> {
      return this.bulkDeleteTemplates(params);
    }

    // Email Template Management
    async getEmailTemplate(params: GetTemplateParams): Promise<EmailTemplate> {
      return getTemplateByType(this.client, "email", params, EmailTemplateSchema);
    }

    async upsertEmailTemplate(
      template: UpsertEmailTemplateParams
    ): Promise<IterableSuccessResponse> {
      return createTemplateByType(this.client, "email", template);
    }

    async updateEmailTemplate(
      options: UpdateEmailTemplateParams
    ): Promise<IterableSuccessResponse> {
      return updateTemplateByType(this.client, "email", options);
    }

    async sendEmailTemplateProof(
      request: SendTemplateProofParams
    ): Promise<IterableSuccessResponse> {
      return sendTemplateProof(this.client, "email", request);
    }

    async previewEmailTemplate(params: PreviewTemplateParams): Promise<string> {
      return previewTemplate(this.client, "email", params);
    }

    // SMS Template Management
    async getSMSTemplate(params: GetTemplateParams): Promise<SMSTemplate> {
      return getTemplateByType(this.client, "sms", params, SMSTemplateSchema);
    }

    async upsertSMSTemplate(
      template: UpsertSMSTemplateParams
    ): Promise<IterableSuccessResponse> {
      return createTemplateByType(this.client, "sms", template);
    }

    async updateSMSTemplate(
      options: UpdateSMSTemplateParams
    ): Promise<IterableSuccessResponse> {
      return updateTemplateByType(this.client, "sms", options);
    }

    async sendSMSTemplateProof(
      request: SendTemplateProofParams
    ): Promise<IterableSuccessResponse> {
      return sendTemplateProof(this.client, "sms", request);
    }

    // Push Template Management
    async getPushTemplate(params: GetTemplateParams): Promise<PushTemplate> {
      return getTemplateByType(this.client, "push", params, PushTemplateSchema);
    }

    async upsertPushTemplate(
      template: UpsertPushTemplateParams
    ): Promise<IterableSuccessResponse> {
      return createTemplateByType(this.client, "push", template);
    }

    async updatePushTemplate(
      options: UpdatePushTemplateParams
    ): Promise<IterableSuccessResponse> {
      return updateTemplateByType(this.client, "push", options);
    }

    async sendPushTemplateProof(
      request: SendTemplateProofParams
    ): Promise<IterableSuccessResponse> {
      return sendTemplateProof(this.client, "push", request);
    }

    // In-App Template Management
    async getInAppTemplate(params: GetTemplateParams): Promise<InAppTemplate> {
      return getTemplateByType(this.client, "inapp", params, InAppTemplateSchema);
    }

    async upsertInAppTemplate(
      template: UpsertInAppTemplateParams
    ): Promise<IterableSuccessResponse> {
      return createTemplateByType(this.client, "inapp", template);
    }

    async updateInAppTemplate(
      options: UpdateInAppTemplateParams
    ): Promise<IterableSuccessResponse> {
      return updateTemplateByType(this.client, "inapp", options);
    }

    async sendInAppTemplateProof(
      request: SendTemplateProofParams
    ): Promise<IterableSuccessResponse> {
      return sendTemplateProof(this.client, "inapp", request);
    }

    async previewInAppTemplate(params: PreviewTemplateParams): Promise<string> {
      return previewTemplate(this.client, "inapp", params);
    }
  };
}

import { z } from "zod";

import { IterableSuccessResponse } from "../types/common.js";
import { IterableSuccessResponseSchema } from "../types/common.js";
import {
  BulkDeleteTemplatesParams,
  BulkDeleteTemplatesResponse,
  BulkDeleteTemplatesResponseSchema,
  EmailTemplate,
  EmailTemplateSchema,
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
import type { Constructor } from "./base.js";
import type { BaseIterableClient } from "./base.js";

/**
 * Templates operations mixin
 */
export function Templates<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    // Helper methods
    async #getTemplateByType<T>(
      pathSegment: string,
      params: GetTemplateParams,
      schema: z.ZodSchema<T>
    ): Promise<T> {
      const queryParams = new URLSearchParams();
      queryParams.append("templateId", params.templateId.toString());
      if (params.locale) {
        queryParams.append("locale", params.locale);
      }

      const response = await this.client.get(
        `/api/templates/${pathSegment}/get?${queryParams.toString()}`
      );
      return this.validateResponse(response, schema);
    }

    async #createTemplateByType<T>(
      pathSegment: string,
      template: T
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post(
        `/api/templates/${pathSegment}/upsert`,
        template
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async #updateTemplateByType<T>(
      pathSegment: string,
      options: T
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post(
        `/api/templates/${pathSegment}/update`,
        options
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async #sendTemplateProof(
      pathSegment: string,
      request: SendTemplateProofParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post(
        `/api/templates/${pathSegment}/proof`,
        request
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async #previewTemplate(
      pathSegment: string,
      params: PreviewTemplateParams
    ): Promise<string> {
      const queryParams = new URLSearchParams();
      queryParams.append("templateId", params.templateId.toString());
      if (params.locale) {
        queryParams.append("locale", params.locale);
      }

      const response = await this.client.post(
        `/api/templates/${pathSegment}/preview?${queryParams.toString()}`,
        params.data || {}
      );
      // The API returns raw HTML as a string
      return this.validateResponse(response, z.string());
    }

    // General template operations
    async getTemplates(
      options?: GetTemplatesParams
    ): Promise<GetTemplatesResponse> {
      const params = new URLSearchParams();
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
      return this.validateResponse(response, GetTemplatesResponseSchema);
    }

    async getTemplateByClientId(
      clientTemplateId: string
    ): Promise<GetTemplateByClientIdResponse> {
      const response = await this.client.get(
        "/api/templates/getByClientTemplateId",
        {
          params: { clientTemplateId },
        }
      );
      return this.validateResponse(
        response,
        GetTemplateByClientIdResponseSchema
      );
    }

    async bulkDeleteTemplates(
      params: BulkDeleteTemplatesParams
    ): Promise<BulkDeleteTemplatesResponse> {
      const response = await this.client.post(
        `/api/templates/bulkDelete`,
        params
      );
      return this.validateResponse(response, BulkDeleteTemplatesResponseSchema);
    }

    /**
     * Delete one or more templates by ID
     * @deprecated Use {@link bulkDeleteTemplates} instead
     */
    async deleteTemplates(
      templateIds: number[]
    ): Promise<BulkDeleteTemplatesResponse> {
      return this.bulkDeleteTemplates({ ids: templateIds });
    }

    // Email Template Management
    async getEmailTemplate(params: GetTemplateParams): Promise<EmailTemplate> {
      return this.#getTemplateByType("email", params, EmailTemplateSchema);
    }

    async upsertEmailTemplate(
      template: UpsertEmailTemplateParams
    ): Promise<IterableSuccessResponse> {
      return this.#createTemplateByType("email", template);
    }

    async updateEmailTemplate(
      options: UpdateEmailTemplateParams
    ): Promise<IterableSuccessResponse> {
      return this.#updateTemplateByType("email", options);
    }

    async sendEmailTemplateProof(
      request: SendTemplateProofParams
    ): Promise<IterableSuccessResponse> {
      return this.#sendTemplateProof("email", request);
    }

    async previewEmailTemplate(params: PreviewTemplateParams): Promise<string> {
      return this.#previewTemplate("email", params);
    }

    // SMS Template Management
    async getSMSTemplate(params: GetTemplateParams): Promise<SMSTemplate> {
      return this.#getTemplateByType("sms", params, SMSTemplateSchema);
    }

    async upsertSMSTemplate(
      template: UpsertSMSTemplateParams
    ): Promise<IterableSuccessResponse> {
      return this.#createTemplateByType("sms", template);
    }

    async updateSMSTemplate(
      options: UpdateSMSTemplateParams
    ): Promise<IterableSuccessResponse> {
      return this.#updateTemplateByType("sms", options);
    }

    async sendSMSTemplateProof(
      request: SendTemplateProofParams
    ): Promise<IterableSuccessResponse> {
      return this.#sendTemplateProof("sms", request);
    }

    // Push Template Management
    async getPushTemplate(params: GetTemplateParams): Promise<PushTemplate> {
      return this.#getTemplateByType("push", params, PushTemplateSchema);
    }

    async upsertPushTemplate(
      template: UpsertPushTemplateParams
    ): Promise<IterableSuccessResponse> {
      return this.#createTemplateByType("push", template);
    }

    async updatePushTemplate(
      options: UpdatePushTemplateParams
    ): Promise<IterableSuccessResponse> {
      return this.#updateTemplateByType("push", options);
    }

    async sendPushTemplateProof(
      request: SendTemplateProofParams
    ): Promise<IterableSuccessResponse> {
      return this.#sendTemplateProof("push", request);
    }

    // In-App Template Management
    async getInAppTemplate(params: GetTemplateParams): Promise<InAppTemplate> {
      return this.#getTemplateByType("inapp", params, InAppTemplateSchema);
    }

    async upsertInAppTemplate(
      template: UpsertInAppTemplateParams
    ): Promise<IterableSuccessResponse> {
      return this.#createTemplateByType("inapp", template);
    }

    async updateInAppTemplate(
      options: UpdateInAppTemplateParams
    ): Promise<IterableSuccessResponse> {
      return this.#updateTemplateByType("inapp", options);
    }

    async sendInAppTemplateProof(
      request: SendTemplateProofParams
    ): Promise<IterableSuccessResponse> {
      return this.#sendTemplateProof("inapp", request);
    }

    async previewInAppTemplate(params: PreviewTemplateParams): Promise<string> {
      return this.#previewTemplate("inapp", params);
    }
  };
}

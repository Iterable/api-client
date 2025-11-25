import {
  IterableSuccessResponse,
  IterableSuccessResponseSchema,
} from "../types/common.js";
import {
  CancelEmailParams,
  CancelInAppParams,
  CancelPushParams,
  CancelSMSParams,
  CancelWebPushParams,
  CancelWhatsAppParams,
  ChannelsResponse,
  ChannelsResponseSchema,
  EmbeddedMessagesResponse,
  EmbeddedMessagesResponseSchema,
  GetEmbeddedMessagesParams,
  GetInAppMessagesParams,
  GetInAppMessagesResponse,
  GetInAppMessagesResponseSchema,
  MessageTypesResponse,
  MessageTypesResponseSchema,
  SendEmailParams,
  SendInAppParams,
  SendPushParams,
  SendSMSParams,
  SendWebPushParams,
  SendWhatsAppParams,
} from "../types/messaging.js";
import type { BaseIterableClient, Constructor } from "./base.js";

/**
 * Messaging operations mixin
 */
export function Messaging<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    // Email Sending
    async sendEmail(
      request: SendEmailParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/email/target", request);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async cancelEmail(
      options: CancelEmailParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/email/cancel", options);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    // SMS
    async sendSMS(options: SendSMSParams): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/sms/target", options);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async cancelSMS(
      options: CancelSMSParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/sms/cancel", options);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    // Push Notifications
    async sendPush(options: SendPushParams): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/push/target", options);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async cancelPush(
      options: CancelPushParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/push/cancel", options);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    // Web Push Messages
    async sendWebPush(
      request: SendWebPushParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/webPush/target", request);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async cancelWebPush(
      options: CancelWebPushParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/webPush/cancel", options);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    // WhatsApp Messages
    async sendWhatsApp(
      request: SendWhatsAppParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/whatsApp/target", request);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async cancelWhatsApp(
      options: CancelWhatsAppParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/whatsApp/cancel", options);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    // In-App Messages
    async getInAppMessages(
      options: GetInAppMessagesParams
    ): Promise<GetInAppMessagesResponse> {
      const params = new URLSearchParams();
      if (options.email) params.append("email", options.email);
      if (options.userId) params.append("userId", options.userId);
      if (options.count) params.append("count", options.count.toString());
      if (options.platform) params.append("platform", options.platform);

      const response = await this.client.get(
        `/api/inApp/getMessages?${params.toString()}`
      );
      return this.validateResponse(response, GetInAppMessagesResponseSchema);
    }

    async sendInApp(
      options: SendInAppParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/inApp/target", options);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async cancelInApp(
      params: CancelInAppParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post("/api/inApp/cancel", params);
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    // Embedded Messaging
    async getEmbeddedMessages(
      params: GetEmbeddedMessagesParams
    ): Promise<EmbeddedMessagesResponse> {
      const queryParams = new URLSearchParams();

      if (params.email) queryParams.append("email", params.email);
      if (params.userId) queryParams.append("userId", params.userId);
      if (params.platform) queryParams.append("platform", params.platform);
      if (params.sdkVersion)
        queryParams.append("sdkVersion", params.sdkVersion);
      if (params.packageName)
        queryParams.append("packageName", params.packageName);

      // Handle array parameters
      if (params.placementIds) {
        params.placementIds.forEach((id) =>
          queryParams.append("placementIds", String(id))
        );
      }
      if (params.currentMessageIds) {
        params.currentMessageIds.forEach((id) =>
          queryParams.append("currentMessageIds", id)
        );
      }

      const response = await this.client.get(
        `/api/embedded-messaging/messages?${queryParams.toString()}`
      );
      return this.validateResponse(response, EmbeddedMessagesResponseSchema);
    }

    // get available message channels
    async getChannels(): Promise<ChannelsResponse> {
      const response = await this.client.get("/api/channels");
      return this.validateResponse(response, ChannelsResponseSchema);
    }

    // get all message types within the project
    async getMessageTypes(): Promise<MessageTypesResponse> {
      const response = await this.client.get("/api/messageTypes");
      return this.validateResponse(response, MessageTypesResponseSchema);
    }
  };
}

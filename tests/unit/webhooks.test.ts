import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import { IterableClient } from "../../src/client";
import { UpdateWebhookParamsSchema } from "../../src/types/webhooks.js";
import { createMockClient } from "../utils/test-helpers";

describe("Webhook Management", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("getWebhooks", () => {
    it("should get all webhooks", async () => {
      const mockResponse = {
        data: {
          webhooks: [
            {
              id: 1,
              authType: "none",
              blastSendEnabled: true,
              enabled: true,
              endpoint: "https://example.com/webhook",
              triggeredSendEnabled: true,
              channelIds: [],
              messageTypeIds: [],
            },
          ],
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getWebhooks();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/webhooks");
      expect(result).toEqual(mockResponse.data);
    });
  });

  // create/delete webhook not supported via API per swagger; update only

  describe("updateWebhook", () => {
    it("should update a webhook", async () => {
      const mockResponse = {
        data: {
          id: 1,
          authType: "none",
          blastSendEnabled: true,
          enabled: false,
          endpoint: "https://example.com/updated-webhook",
          triggeredSendEnabled: true,
          channelIds: [],
          messageTypeIds: [],
        },
      };
      const options = {
        webhookId: 1,
        url: "https://example.com/updated-webhook",
        active: false,
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.updateWebhook(options);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/webhooks",
        options
      );
      expect(result).toEqual(mockResponse.data);
      expect(result.id).toBe(1);
      expect(result.enabled).toBe(false);
      expect(result.endpoint).toBe("https://example.com/updated-webhook");
    });
  });

  // deleteWebhook not supported via API

  describe("Schema Validation", () => {
    it("should validate webhook parameters", () => {
      // Valid webhook update
      expect(() =>
        UpdateWebhookParamsSchema.parse({
          webhookId: 1,
          url: "https://example.com/webhook",
          events: ["emailSend", "emailClick"],
          active: true,
        })
      ).not.toThrow();

      // Invalid URL
      expect(() =>
        UpdateWebhookParamsSchema.parse({
          webhookId: 1,
          url: "not-a-valid-url",
        })
      ).toThrow();

      // Invalid - missing webhookId
      expect(() =>
        UpdateWebhookParamsSchema.parse({
          url: "https://example.com/webhook",
        })
      ).toThrow();
    });
  });
});

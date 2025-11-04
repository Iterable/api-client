import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import { IterableClient } from "../../src/client";
import {
  GetInAppMessagesParamsSchema,
  SendEmailParamsSchema,
  SendInAppParamsSchema,
  SendPushParamsSchema,
  SendSMSParamsSchema,
  SendWebPushParamsSchema,
  SendWhatsAppParamsSchema,
} from "../../src/types/messaging.js";
import {
  createMockClient,
  createMockIterableResponse,
  TEST_USER_EMAIL,
} from "../utils/test-helpers";

describe("Messaging Operations", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Messaging Channels", () => {
    // Messaging test configuration
    interface MessagingTestConfig {
      methodName: string;
      displayName: string;
      endpoint: string;
      requestData: Record<string, any>;
    }

    const _messagingTests: MessagingTestConfig[] = [
      {
        methodName: "sendWhatsApp",
        displayName: "WhatsApp message",
        endpoint: "/api/whatsApp/target",
        requestData: {
          campaignId: 12345,
          recipientEmail: TEST_USER_EMAIL,
          dataFields: { firstName: "Test" },
        },
      },
      {
        methodName: "sendSMS",
        displayName: "SMS message",
        endpoint: "/api/sms/target",
        requestData: {
          campaignId: 12345,
          recipientPhone: "+1234567890",
          dataFields: { firstName: "Test" },
        },
      },
      {
        methodName: "sendWebPush",
        displayName: "web push message",
        endpoint: "/api/webPush/target",
        requestData: {
          campaignId: 12345,
          recipientEmail: TEST_USER_EMAIL,
          dataFields: { firstName: "Test" },
        },
      },
      {
        methodName: "sendPush",
        displayName: "push notification",
        endpoint: "/api/push/target",
        requestData: {
          campaignId: 12345,
          recipientEmail: TEST_USER_EMAIL,
          dataFields: { firstName: "Test" },
        },
      },
    ];

    // Note: Send operations are pure pass-through - tested in integration tests
  });

  describe("In-App Messaging", () => {
    describe("getInAppMessages", () => {
      it("should get in-app messages for user", async () => {
        const mockResponse = {
          data: {
            inAppMessages: [
              {
                messageId: "msg123",
                campaignId: 12345,
                content: { html: "<div>Test</div>" },
                trigger: { type: "event" },
                createdAt: 1640995200000,
              },
            ],
          },
        };
        const options = { email: TEST_USER_EMAIL, count: 10 };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.getInAppMessages(options);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/api/inApp/getMessages?email=test%2Bmcptest%40example.com&count=10"
        );
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe("sendInApp", () => {
      it("should send in-app message", async () => {
        const mockResponse = { data: createMockIterableResponse() };
        const options = {
          campaignId: 12345,
          recipientEmail: TEST_USER_EMAIL,
          dataFields: { firstName: "Test" },
        };
        mockAxiosInstance.post.mockResolvedValue(mockResponse);

        const result = await client.sendInApp(options);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/api/inApp/target",
          options
        );
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe("getEmbeddedMessages", () => {
      it("should get embedded messages with all parameters", async () => {
        const mockResponse = {
          data: {
            placements: {
              placement1: {
                messages: [{ messageId: "embedded123" }],
              },
            },
          },
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.getEmbeddedMessages({
          email: TEST_USER_EMAIL,
          platform: "Web",
          sdkVersion: "6.5.0",
          packageName: "com.example.web",
          placementIds: [123, 456],
          currentMessageIds: ["msg1", "msg2"],
        });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          `/api/embedded-messaging/messages?email=${encodeURIComponent(TEST_USER_EMAIL)}&platform=Web&sdkVersion=6.5.0&packageName=com.example.web&placementIds=123&placementIds=456&currentMessageIds=msg1&currentMessageIds=msg2`
        );
        expect(result).toEqual(mockResponse.data);
      });

      it("should get embedded messages with minimal parameters", async () => {
        const mockResponse = {
          data: {
            placements: {},
          },
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.getEmbeddedMessages({
          userId: "user456",
        });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          `/api/embedded-messaging/messages?userId=user456`
        );
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe("Messaging Information", () => {
    describe("getChannels", () => {
      it("should get all channels", async () => {
        const mockResponse = {
          data: {
            channels: [
              {
                id: 1,
                name: "Email",
                channelType: "Email",
                messageMedium: "Email",
              },
              {
                id: 2,
                name: "SMS",
                channelType: "SMS",
                messageMedium: "SMS",
              },
            ],
          },
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.getChannels();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/channels");
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe("getMessageTypes", () => {
      it("should get all message types", async () => {
        const mockResponse = {
          data: {
            messageTypes: [
              {
                id: 1,
                name: "Promotional",
                channelId: 1,
                subscriptionPolicy: "OptIn",
                rateLimitPerMinute: 100,
              },
              {
                id: 2,
                name: "Transactional",
                channelId: 1,
                subscriptionPolicy: "OptOut",
              },
            ],
          },
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.getMessageTypes();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/messageTypes");
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe("Schema Validation", () => {
    describe("Email Schemas", () => {
      it("should validate send_email parameters", () => {
        // Valid parameters
        expect(() =>
          SendEmailParamsSchema.parse({
            campaignId: 12345,
            recipientEmail: "test@example.com",
            dataFields: { firstName: "Test" },
          })
        ).not.toThrow();

        // Missing required campaignId
        expect(() =>
          SendEmailParamsSchema.parse({
            recipientEmail: "test@example.com",
          })
        ).toThrow();
      });
    });

    describe("Messaging Channel Schemas", () => {
      it("should validate WhatsApp parameters", () => {
        // Valid with phone
        expect(() =>
          SendWhatsAppParamsSchema.parse({
            campaignId: 12345,
            recipientPhone: "+1234567890",
          })
        ).not.toThrow();

        // Valid with email
        expect(() =>
          SendWhatsAppParamsSchema.parse({
            campaignId: 12345,
            recipientEmail: "test@example.com",
          })
        ).not.toThrow();

        // Valid with userId
        expect(() =>
          SendWhatsAppParamsSchema.parse({
            campaignId: 12345,
            recipientUserId: "123",
          })
        ).not.toThrow();

        // Invalid - no recipient identifiers
        expect(() =>
          SendWhatsAppParamsSchema.parse({
            campaignId: 12345,
          })
        ).toThrow();
      });

      it("should validate SMS parameters", () => {
        // Valid with phone
        expect(() =>
          SendSMSParamsSchema.parse({
            campaignId: 12345,
            recipientPhone: "+1234567890",
          })
        ).not.toThrow();

        // Invalid - no recipient identifiers
        expect(() =>
          SendSMSParamsSchema.parse({
            campaignId: 12345,
          })
        ).toThrow();
      });

      it("should validate web push parameters", () => {
        // Valid with email
        expect(() =>
          SendWebPushParamsSchema.parse({
            campaignId: 12345,
            recipientEmail: "test@example.com",
          })
        ).not.toThrow();

        // Invalid - no recipient identifiers
        expect(() =>
          SendWebPushParamsSchema.parse({
            campaignId: 12345,
          })
        ).toThrow();
      });

      it("should validate push notification parameters", () => {
        // Valid with email
        expect(() =>
          SendPushParamsSchema.parse({
            campaignId: 12345,
            recipientEmail: "test@example.com",
          })
        ).not.toThrow();

        // Invalid - no recipient identifiers
        expect(() =>
          SendPushParamsSchema.parse({
            campaignId: 12345,
          })
        ).toThrow();
      });
    });

    describe("In-App Message Schemas", () => {
      it("should validate in-app message parameters", () => {
        // Valid get_in_app_messages
        expect(() =>
          GetInAppMessagesParamsSchema.parse({
            email: "test@example.com",
            count: 10,
            platform: "iOS",
          })
        ).not.toThrow();

        // Valid send_in_app
        expect(() =>
          SendInAppParamsSchema.parse({
            campaignId: 12345,
            recipientEmail: "test@example.com",
          })
        ).not.toThrow();

        // Invalid platform
        expect(() =>
          GetInAppMessagesParamsSchema.parse({
            email: "test@example.com",
            platform: "InvalidPlatform",
          })
        ).toThrow();
      });
    });
  });
});

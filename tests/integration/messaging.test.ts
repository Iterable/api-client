import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import { expectValidationError } from "../utils/error-matchers";
import {
  cleanupTestUser,
  createTestIdentifiers,
  withTimeout,
} from "../utils/test-helpers";

describe("Messaging Integration Tests", () => {
  let client: IterableClient;
  const { testUserEmail } = createTestIdentifiers();

  beforeAll(async () => {
    client = new IterableClient();
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);
    client.destroy();
  });

  describe("Configuration and metadata", () => {
    it("should retrieve webhooks", async () => {
      const response = await withTimeout(client.getWebhooks());

      expect(response).toHaveProperty("webhooks");
      expect(Array.isArray(response.webhooks)).toBe(true);
    });

    it("should get channels", async () => {
      const result = await withTimeout(client.getChannels());

      expect(result).toBeDefined();
      expect(result.channels).toBeDefined();
      expect(Array.isArray(result.channels)).toBe(true);

      if (result.channels.length > 0) {
        const channel = result.channels[0];
        expect(channel).toHaveProperty("id");
        expect(channel).toHaveProperty("name");
        expect(channel).toHaveProperty("channelType");
        expect(channel).toHaveProperty("messageMedium");
      }
    });

    it("should get message types", async () => {
      const result = await withTimeout(client.getMessageTypes());

      expect(result).toBeDefined();
      expect(result.messageTypes).toBeDefined();
      expect(Array.isArray(result.messageTypes)).toBe(true);

      if (result.messageTypes.length > 0) {
        const messageType = result.messageTypes[0];
        expect(messageType).toHaveProperty("id");
        expect(messageType).toHaveProperty("name");
        expect(messageType).toHaveProperty("channelId");
      }
    });
  });

  describe("In-app messaging", () => {
    it("should get basic in-app messages for user", async () => {
      const response = await withTimeout(
        client.getInAppMessages({
          email: testUserEmail,
          count: 5,
          platform: "Web",
        })
      );

      expect(response).toHaveProperty("inAppMessages");
      expect(Array.isArray(response.inAppMessages)).toBe(true);
    });
  });

  describe("Embedded messaging", () => {
    it("should get embedded messages for user", async () => {
      const response = await withTimeout(
        client.getEmbeddedMessages({
          email: testUserEmail,
          platform: "Web",
        })
      );

      expect(response).toBeDefined();
      // Response structure may vary, just verify it doesn't error
    });
  });

  describe("Send operations (parameter validation)", () => {
    const sendOperations = [
      {
        name: "email",
        method: (client: IterableClient) =>
          client.sendEmail({
            recipientEmail: testUserEmail,
            campaignId: 999999, // Non-existent campaign
          }),
      },
      {
        name: "SMS",
        method: (client: IterableClient) =>
          client.sendSMS({
            recipientEmail: testUserEmail,
            campaignId: 999999, // Non-existent campaign
          }),
      },
      {
        name: "push notification",
        method: (client: IterableClient) =>
          client.sendPush({
            recipientEmail: testUserEmail,
            campaignId: 999999, // Non-existent campaign
          }),
      },
      {
        name: "web push",
        method: (client: IterableClient) =>
          client.sendWebPush({
            recipientEmail: testUserEmail,
            campaignId: 999999, // Non-existent campaign
          }),
      },
      {
        name: "WhatsApp",
        method: (client: IterableClient) =>
          client.sendWhatsApp({
            recipientEmail: testUserEmail,
            campaignId: 999999, // Non-existent campaign
          }),
      },
      {
        name: "in-app message",
        method: (client: IterableClient) =>
          client.sendInApp({
            recipientEmail: testUserEmail,
            campaignId: 999999, // Non-existent campaign
          }),
      },
    ];

    sendOperations.forEach(({ name, method }) => {
      it(`should validate ${name} send parameters`, async () => {
        // Expect validation error for invalid campaign ID
        await expectValidationError(method(client), 400);
      });
    });
  });

  describe("Message cancellation (parameter validation)", () => {
    const cancelMethods = [
      {
        name: "email",
        method: (client: IterableClient) =>
          client.cancelEmail({ campaignId: 0, scheduledMessageId: 999999 }),
      },
      {
        name: "SMS",
        method: (client: IterableClient) =>
          client.cancelSMS({ campaignId: 0, scheduledMessageId: 999999 }),
      },
      {
        name: "web push",
        method: (client: IterableClient) =>
          client.cancelWebPush({
            campaignId: 0,
            scheduledMessageId: 999999,
          }),
      },
      {
        name: "push",
        method: (client: IterableClient) =>
          client.cancelPush({ campaignId: 0, scheduledMessageId: 999999 }),
      },
      {
        name: "WhatsApp",
        method: (client: IterableClient) =>
          client.cancelWhatsApp({
            campaignId: 0,
            scheduledMessageId: 999999,
          }),
      },
    ];

    cancelMethods.forEach(({ name, method }) => {
      it(`should validate ${name} cancellation parameters`, async () => {
        await expectValidationError(method(client));
      });
    });
  });
});

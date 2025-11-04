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
  DeleteTemplateParamsSchema,
  EmailTemplateSchema,
  InAppTemplateSchema,
  PushTemplateSchema,
  SMSTemplateSchema,
  TemplateProofRequestSchema,
  UpdateEmailTemplateParamsSchema,
  UpsertEmailTemplateParamsSchema,
} from "../../src/types/templates.js";
import {
  createMockClient,
  createMockIterableResponse,
  createMockTemplate,
} from "../utils/test-helpers";

describe("Template Management", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getTemplates", () => {
    it("should get templates with filters", async () => {
      const mockResponse = { data: { templates: [createMockTemplate()] } };
      const options = {
        templateType: "Triggered" as const,
        messageMedium: "Email" as const,
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getTemplates(options);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/templates?templateType=Triggered&messageMedium=Email"
      );
    });
  });

  describe("upsertEmailTemplate", () => {
    it("should upsert email template", async () => {
      const mockResponse = {
        data: { msg: "Template created", code: "Success" },
      };
      const template = {
        name: "New Template",
        subject: "Test Subject",
        html: "<html><body>Test</body></html>",
        clientTemplateId: "test-template-123",
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.upsertEmailTemplate(template);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/templates/email/upsert",
        template
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("updateEmailTemplate", () => {
    it("should update email template", async () => {
      const mockResponse = {
        data: { msg: "Template updated", code: "Success" },
      };
      const updateData = {
        templateId: 12345,
        name: "Updated Template",
        subject: "Updated Subject",
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.updateEmailTemplate(updateData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/templates/email/update",
        updateData
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("deleteTemplates", () => {
    it("should delete templates", async () => {
      const templateIds = [12345, 67890];
      const mockResponse = {
        data: {
          success: templateIds,
          failed: [],
          failureReason: "",
        },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.deleteTemplates(templateIds);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/templates/bulkDelete",
        { ids: templateIds }
      );
      expect(result).toEqual({
        success: templateIds,
        failed: [],
        failureReason: "",
      });
    });
  });

  describe("bulkDeleteTemplates", () => {
    it("should bulk delete multiple templates", async () => {
      const templateIds = [67890, 67891, 67892];
      const mockResponse = { data: createMockIterableResponse() };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.bulkDeleteTemplates({ ids: templateIds });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/templates/bulkDelete",
        { ids: templateIds }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("Schema Validation", () => {
    it("should validate template parameters", () => {
      // Valid create template
      expect(() =>
        UpsertEmailTemplateParamsSchema.parse({
          name: "Test Template",
          subject: "Test Subject",
          html: "<html><body>Test</body></html>",
          clientTemplateId: "test-template-123",
        })
      ).not.toThrow();

      // Valid update template
      expect(() =>
        UpdateEmailTemplateParamsSchema.parse({
          templateId: 12345,
          name: "Updated Template",
          subject: "Updated Subject",
        })
      ).not.toThrow();

      // Invalid delete template (negative ID)
      expect(() =>
        DeleteTemplateParamsSchema.parse({
          templateId: -1,
        })
      ).toThrow();

      // Invalid delete template (zero ID)
      expect(() =>
        DeleteTemplateParamsSchema.parse({
          templateId: 0,
        })
      ).toThrow();
    });

    describe("Template Response Schemas", () => {
      it("should validate email template response", () => {
        const validEmailTemplate = {
          templateId: 12345,
          name: "Test Email Template",
          subject: "Test Subject",
          fromName: "Test Sender",
          fromEmail: "test@example.com",
          html: "<html><body>Test</body></html>",
          plainText: "Test",
          createdAt: 1640995200000,
          updatedAt: 1640995200000,
          cacheDataFeed: true,
          mergeDataFeedContext: false,
        };

        expect(() =>
          EmailTemplateSchema.parse(validEmailTemplate)
        ).not.toThrow();

        // Test required fields
        expect(() =>
          EmailTemplateSchema.parse({
            ...validEmailTemplate,
            templateId: undefined,
          })
        ).toThrow();

        expect(() =>
          EmailTemplateSchema.parse({ ...validEmailTemplate, name: undefined })
        ).toThrow();

        // Test optional fields can be omitted
        expect(() =>
          EmailTemplateSchema.parse({
            templateId: 12345,
            name: "Minimal Template",
          })
        ).not.toThrow();
      });

      it("should validate SMS template response", () => {
        const validSMSTemplate = {
          templateId: 12345,
          name: "Test SMS Template",
          message: "Hello {{firstName}}!",
          createdAt: 1640995200000,
          updatedAt: 1640995200000,
          messageTypeId: 1,
          trackingDomain: "example.com",
        };

        expect(() => SMSTemplateSchema.parse(validSMSTemplate)).not.toThrow();

        // Test minimal valid template
        expect(() =>
          SMSTemplateSchema.parse({
            templateId: 12345,
            name: "Minimal SMS Template",
          })
        ).not.toThrow();
      });

      it("should validate push template response", () => {
        const validPushTemplate = {
          templateId: 12345,
          name: "Test Push Template",
          message: "Hello {{firstName}}!",
          title: "Push Title",
          badge: "1",
          sound: "default",
          payload: { customKey: "customValue" },
          createdAt: 1640995200000,
          updatedAt: 1640995200000,
          isSilentPush: false,
          wake: true,
          relevanceScore: 0.8,
        };

        expect(() => PushTemplateSchema.parse(validPushTemplate)).not.toThrow();

        // Test minimal valid template
        expect(() =>
          PushTemplateSchema.parse({
            templateId: 12345,
            name: "Minimal Push Template",
          })
        ).not.toThrow();
      });

      it("should validate in-app template response", () => {
        const validInAppTemplate = {
          templateId: 12345,
          name: "Test InApp Template",
          html: "<div>Hello {{firstName}}!</div>",
          createdAt: 1640995200000,
          updatedAt: 1640995200000,
          expirationDuration: "now+90d",
          payload: { customKey: "customValue" },
          inAppDisplaySettings: { position: "center" },
        };

        expect(() =>
          InAppTemplateSchema.parse(validInAppTemplate)
        ).not.toThrow();

        // Test minimal valid template
        expect(() =>
          InAppTemplateSchema.parse({
            templateId: 12345,
            name: "Minimal InApp Template",
          })
        ).not.toThrow();
      });
    });
  });

  // Template proof functionality tests
  describe("Template Proof Operations", () => {
    const mockProofRequest = {
      templateId: 12345,
      recipientEmail: "test@example.com",
      dataFields: { firstName: "Test", lastName: "User" },
      locale: "en-US",
    };

    const mockSuccessResponse = {
      data: { msg: "Proof sent successfully", code: "Success" },
    };

    beforeEach(() => {
      mockAxiosInstance.post.mockResolvedValue(mockSuccessResponse);
    });

    describe("Template proof schema validation", () => {
      it("should validate proof request with email", () => {
        const result = TemplateProofRequestSchema.safeParse(mockProofRequest);
        expect(result.success).toBe(true);
      });

      it("should validate proof request with userId", () => {
        const requestWithUserId = {
          templateId: 12345,
          recipientUserId: "user123",
          dataFields: { firstName: "Test" },
        };
        const result = TemplateProofRequestSchema.safeParse(requestWithUserId);
        expect(result.success).toBe(true);
      });

      it("should require either email or userId", () => {
        const invalidRequest = {
          templateId: 12345,
          dataFields: { firstName: "Test" },
        };
        const result = TemplateProofRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
      });

      it("should require templateId", () => {
        const invalidRequest = {
          recipientEmail: "test@example.com",
        };
        const result = TemplateProofRequestSchema.safeParse(invalidRequest);
        expect(result.success).toBe(false);
      });
    });

    describe("Proof method implementations", () => {
      const proofTests = [
        {
          method: "sendEmailTemplateProof",
          endpoint: "/api/templates/email/proof",
          type: "email",
        },
        {
          method: "sendSMSTemplateProof",
          endpoint: "/api/templates/sms/proof",
          type: "SMS",
        },
        {
          method: "sendPushTemplateProof",
          endpoint: "/api/templates/push/proof",
          type: "push",
        },
        {
          method: "sendInAppTemplateProof",
          endpoint: "/api/templates/inapp/proof",
          type: "in-app",
        },
      ] as const;

      proofTests.forEach(({ method, endpoint, type }) => {
        it(`should send ${type} template proof to correct endpoint`, async () => {
          const result = await (client as any)[method](mockProofRequest);

          expect(mockAxiosInstance.post).toHaveBeenCalledWith(
            endpoint,
            mockProofRequest
          );
          expect(result).toEqual(mockSuccessResponse.data);
        });

        it(`should handle ${type} template proof with minimal data`, async () => {
          const minimalRequest = {
            templateId: 12345,
            recipientEmail: "test@example.com",
          };

          await (client as any)[method](minimalRequest);

          expect(mockAxiosInstance.post).toHaveBeenCalledWith(
            endpoint,
            minimalRequest
          );
        });
      });
    });
  });

  describe("SMS Template Schema Validation", () => {
    it("should validate SMS template schema with mock data", async () => {
      const { SMSTemplateSchema } = await import(
        "../../src/types/templates.js"
      );

      const mockSMSTemplate = {
        templateId: 12345,
        name: "Test SMS Template",
        message: "Hello {{firstName}}! This is a test SMS.",
        creatorUserId: "test@example.com",
        messageTypeId: 40404,
        clientTemplateId: "test-sms-template",
        locale: "en",
        isDefaultLocale: true,
        trackingDomain: "example.com",
      };

      const result = SMSTemplateSchema.safeParse(mockSMSTemplate);
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.templateId).toBe(12345);
        expect(result.data.message).toBe(
          "Hello {{firstName}}! This is a test SMS."
        );
      }
    });
  });

  describe("Template Preview", () => {
    describe("previewEmailTemplate", () => {
      it("should preview email template with user data", async () => {
        const mockHtml = "<html><body><h1>Hello John!</h1></body></html>";
        mockAxiosInstance.post.mockResolvedValue({ data: mockHtml });

        const params = {
          templateId: 123,
          data: {
            dataFields: { firstName: "John", email: "john@example.com" },
          },
        };

        const result = await client.previewEmailTemplate(params);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/api/templates/email/preview?templateId=123",
          { dataFields: { firstName: "John", email: "john@example.com" } }
        );
        expect(result).toBe(mockHtml);
      });

      it("should preview email template with event data", async () => {
        const mockHtml = "<html><body><p>Total: $25.99</p></body></html>";
        mockAxiosInstance.post.mockResolvedValue({ data: mockHtml });

        const params = {
          templateId: 456,
          data: {
            dataFields: { eventName: "purchase", total: 25.99 },
          },
        };

        const result = await client.previewEmailTemplate(params);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/api/templates/email/preview?templateId=456",
          { dataFields: { eventName: "purchase", total: 25.99 } }
        );
        expect(result).toBe(mockHtml);
      });

      it("should preview email template with data feed", async () => {
        const mockHtml =
          "<html><body><p>Product: Widget - $19.99</p></body></html>";
        mockAxiosInstance.post.mockResolvedValue({ data: mockHtml });

        const params = {
          templateId: 789,
          data: {
            dataFeed: { productName: "Widget", price: 19.99 },
          },
        };

        const result = await client.previewEmailTemplate(params);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/api/templates/email/preview?templateId=789",
          { dataFeed: { productName: "Widget", price: 19.99 } }
        );
        expect(result).toBe(mockHtml);
      });

      it("should preview email template with fetchDataFeeds", async () => {
        const mockHtml =
          "<html><body><p>Product: Widget - $19.99</p></body></html>";
        mockAxiosInstance.post.mockResolvedValue({ data: mockHtml });

        const params = {
          templateId: 789,
          data: {
            dataFields: { userId: "123" },
            fetchDataFeeds: true,
          },
        };

        const result = await client.previewEmailTemplate(params);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/api/templates/email/preview?templateId=789",
          { dataFields: { userId: "123" }, fetchDataFeeds: true }
        );
        expect(result).toBe(mockHtml);
      });

      it("should preview email template with locale", async () => {
        const mockHtml = "<html><body><h1>Bonjour!</h1></body></html>";
        mockAxiosInstance.post.mockResolvedValue({ data: mockHtml });

        const params = {
          templateId: 123,
          locale: "fr",
          data: {
            dataFields: { firstName: "Jean" },
          },
        };

        const result = await client.previewEmailTemplate(params);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/api/templates/email/preview?templateId=123&locale=fr",
          { dataFields: { firstName: "Jean" } }
        );
        expect(result).toBe(mockHtml);
      });

      it("should preview email template without data", async () => {
        const mockHtml = "<html><body><h1>Default Content</h1></body></html>";
        mockAxiosInstance.post.mockResolvedValue({ data: mockHtml });

        const params = {
          templateId: 123,
        };

        const result = await client.previewEmailTemplate(params);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/api/templates/email/preview?templateId=123",
          {}
        );
        expect(result).toBe(mockHtml);
      });
    });

    describe("previewInAppTemplate", () => {
      it("should preview in-app template with user data", async () => {
        const mockHtml = "<div><h2>Hello Sarah!</h2></div>";
        mockAxiosInstance.post.mockResolvedValue({ data: mockHtml });

        const params = {
          templateId: 321,
          data: {
            dataFields: { firstName: "Sarah" },
          },
        };

        const result = await client.previewInAppTemplate(params);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/api/templates/inapp/preview?templateId=321",
          { dataFields: { firstName: "Sarah" } }
        );
        expect(result).toBe(mockHtml);
      });

      it("should preview in-app template with all data types", async () => {
        const mockHtml =
          "<div><h2>Hello Bob!</h2><p>Order: #12345</p><p>Product: Widget</p></div>";
        mockAxiosInstance.post.mockResolvedValue({ data: mockHtml });

        const params = {
          templateId: 654,
          data: {
            dataFields: { firstName: "Bob", orderId: "12345" },
            dataFeed: { productName: "Widget" },
          },
        };

        const result = await client.previewInAppTemplate(params);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/api/templates/inapp/preview?templateId=654",
          {
            dataFields: { firstName: "Bob", orderId: "12345" },
            dataFeed: { productName: "Widget" },
          }
        );
        expect(result).toBe(mockHtml);
      });

      it("should preview in-app template with locale", async () => {
        const mockHtml = "<div><h2>Hola!</h2></div>";
        mockAxiosInstance.post.mockResolvedValue({ data: mockHtml });

        const params = {
          templateId: 987,
          locale: "es",
        };

        const result = await client.previewInAppTemplate(params);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith(
          "/api/templates/inapp/preview?templateId=987&locale=es",
          {}
        );
        expect(result).toBe(mockHtml);
      });
    });
  });
});

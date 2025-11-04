import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import { logger } from "../../src/logger";
import { EmailTemplateSchema } from "../../src/types/templates.js";
import {
  cleanupTestUser,
  createTestIdentifiers,
  retryWithBackoff,
  uniqueId,
  withTimeout,
} from "../utils/test-helpers";

describe("Template Management Integration Tests", () => {
  let client: IterableClient;
  const { testUserEmail } = createTestIdentifiers();

  // Helper function to extract template ID from response
  const extractTemplateId = (response: { msg: string }): number => {
    const templateIdMatch = response.msg.match(/IDs: (\d+)/);
    if (!templateIdMatch || !templateIdMatch[1]) {
      throw new Error(
        `Could not extract template ID from response: ${response.msg}`
      );
    }
    return parseInt(templateIdMatch[1]);
  };

  // Helper function to create test templates for different types
  const createTestTemplate = {
    email: (overrides: Partial<any> = {}) => ({
      name: uniqueId("Test-Email-Template"),
      clientTemplateId: uniqueId("test-email-template"),
      subject: "Integration Test Email",
      fromName: "Alex Newman",
      fromEmail: "alex.newman@iterable.com",
      html: "<html><body><h1>Test Email</h1><p>Hello {{firstName}}!</p><p><a href='{{unsubscribeUrl}}'>Unsubscribe</a></p></body></html>",
      plainText:
        "Test Email\n\nHello {{firstName}}!\n\nUnsubscribe: {{unsubscribeUrl}}",
      templateType: "Base" as const,
      ...overrides,
    }),
    push: (overrides: Partial<any> = {}) => ({
      name: uniqueId("Test-Push-Template"),
      clientTemplateId: uniqueId("test-push-template"),
      message: "Test push: Hello {{firstName}}!",
      title: "Test Push",
      ...overrides,
    }),
    inapp: (overrides: Partial<any> = {}) => ({
      name: uniqueId("Test-InApp-Template"),
      clientTemplateId: uniqueId("test-inapp-template"),
      html: "<div><h2>Test InApp</h2><p>Hello {{firstName}}!</p></div>",
      ...overrides,
    }),
  };

  // Helper function to wait for template availability
  const waitForTemplate = async (templateId: number, getMethod: string) => {
    return retryWithBackoff(
      async () => {
        return await (client as any)[getMethod]({ templateId });
      },
      {
        description: `Template ${templateId} to be available for GET`,
        initialIntervalMs: 500,
        maxIntervalMs: 5000,
        timeoutMs: 15000,
        shouldRetryOnError: (error: any) =>
          error.statusCode === 404 || error.statusCode === 500,
      }
    );
  };

  beforeAll(async () => {
    client = new IterableClient();
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);
    client.destroy();
  });

  describe("Template Retrieval", () => {
    it("should retrieve templates", async () => {
      await withTimeout(client.getTemplates());
    });

    it("should retrieve templates with filters", async () => {
      await withTimeout(
        client.getTemplates({ messageMedium: "Email", limit: 5 })
      );
      await withTimeout(
        client.getTemplates({ messageMedium: "SMS", limit: 5 })
      );
      await withTimeout(
        client.getTemplates({ messageMedium: "Push", limit: 5 })
      );
      await withTimeout(
        client.getTemplates({ messageMedium: "InApp", limit: 5 })
      );
      await withTimeout(
        client.getTemplates({ templateType: "Triggered", limit: 5 })
      );
      await withTimeout(
        client.getTemplates({
          messageMedium: "Email",
          templateType: "Base",
          limit: 3,
        })
      );
    });

    it("should retrieve template by client ID", async () => {
      const clientTemplateId = uniqueId("test-client-template");
      const templateData = createTestTemplate.email({
        clientTemplateId,
        name: uniqueId("Test-Client-ID-Template"),
      });

      let templateId: number | undefined;
      try {
        const createResponse = await withTimeout(
          client.upsertEmailTemplate(templateData)
        );
        templateId = extractTemplateId(createResponse as { msg: string });

        const retrievedTemplateResponse = await withTimeout(
          client.getTemplateByClientId(clientTemplateId)
        );
        expect(retrievedTemplateResponse.templates.length).toBeGreaterThan(0);
        const retrievedTemplate = retrievedTemplateResponse.templates[0]!;
        expect(retrievedTemplate.templateId).toBe(templateId);
      } finally {
        if (templateId) {
          await withTimeout(client.deleteTemplates([templateId]));
        }
      }
    });
  });

  // Comprehensive template type configurations for all operations
  const templateTypes = [
    {
      type: "Email",
      createMethod: "upsertEmailTemplate" as const,
      getMethod: "getEmailTemplate" as const,
      updateMethod: "updateEmailTemplate" as const,
      proofMethod: "sendEmailTemplateProof" as const,
      schema: EmailTemplateSchema,
      createData: () => createTestTemplate.email(),
      updateData: (templateId: number, originalData: any) => ({
        templateId,
        name: `${originalData.name} (Updated)`,
        subject: `${originalData.subject} (Updated)`,
      }),
      proofData: (templateId: number, recipientEmail: string) => ({
        templateId,
        recipientEmail,
        dataFields: { firstName: "ProofTest", lastName: "User" },
        locale: "en",
      }),
    },
    {
      type: "Push",
      createMethod: "upsertPushTemplate" as const,
      getMethod: "getPushTemplate" as const,
      updateMethod: "updatePushTemplate" as const,
      proofMethod: "sendPushTemplateProof" as const,
      schema: null, // We'll import this dynamically
      createData: () => createTestTemplate.push(),
      updateData: (templateId: number, originalData: any) => ({
        templateId,
        name: `${originalData.name} (Updated)`,
        message: `${originalData.message} (Updated)`,
      }),
      proofData: (templateId: number, recipientEmail: string) => ({
        templateId,
        recipientEmail,
        dataFields: { firstName: "ProofTest" },
      }),
    },
    {
      type: "InApp",
      createMethod: "upsertInAppTemplate" as const,
      getMethod: "getInAppTemplate" as const,
      updateMethod: "updateInAppTemplate" as const,
      proofMethod: "sendInAppTemplateProof" as const,
      schema: null, // We'll import this dynamically
      createData: () => createTestTemplate.inapp(),
      updateData: (templateId: number, originalData: any) => ({
        templateId,
        name: `${originalData.name} (Updated)`,
        html: "<div><h2>Updated</h2><p>Updated in-app message</p></div>",
      }),
      proofData: (templateId: number, recipientEmail: string) => ({
        templateId,
        recipientEmail,
        dataFields: { firstName: "ProofTest" },
      }),
      // SMS sends aren't set up yet in the test environment
    },
  ] as const;

  describe("Template CRUD Operations", () => {
    templateTypes.forEach(
      ({
        type,
        createMethod,
        getMethod,
        updateMethod,
        proofMethod,
        createData,
        updateData,
        proofData,
      }) => {
        describe(`${type} Templates`, () => {
          it(`should create, get, update, and delete ${type.toLowerCase()} template`, async () => {
            const templateData = createData();
            let templateId: number | undefined;

            try {
              const createResponse = await withTimeout(
                (client as any)[createMethod](templateData)
              );
              templateId = extractTemplateId(createResponse as { msg: string });

              const getResponse = await waitForTemplate(templateId, getMethod);
              expect(getResponse.templateId).toBe(templateId);

              const updateParams = updateData(templateId, templateData);
              await withTimeout((client as any)[updateMethod](updateParams));

              const updatedTemplate = await waitForTemplate(
                templateId,
                getMethod
              );
              expect(updatedTemplate.name).toBe(updateParams.name);

              const deleteResponse = await withTimeout(
                client.deleteTemplates([templateId])
              );
              expect(deleteResponse.success).toContain(templateId);
              templateId = undefined;
            } finally {
              if (templateId) {
                try {
                  await withTimeout(client.deleteTemplates([templateId]));
                } catch (cleanupError) {
                  logger.warn(
                    `Failed to cleanup ${type} template ${templateId}:`,
                    cleanupError
                  );
                }
              }
            }
          });

          it(`should send ${type.toLowerCase()} template proof`, async () => {
            const templateData = createData();
            let templateId: number | undefined;

            try {
              // Create template for proof testing
              const createResponse = await withTimeout(
                (client as any)[createMethod](templateData)
              );
              expect(createResponse).toHaveProperty("code", "Success");
              templateId = extractTemplateId(createResponse as { msg: string });

              // Wait for template to be available
              await waitForTemplate(templateId, getMethod);

              // Ensure test user exists
              await withTimeout(
                client.updateUser({
                  email: testUserEmail,
                  dataFields: { firstName: "ProofTest", lastName: "User" },
                })
              );

              const proofRequest = proofData(templateId, testUserEmail);
              const result = (await withTimeout(
                (client as any)[proofMethod](proofRequest)
              )) as { msg: string; code: string };

              expect(result.msg).toContain("Sent proof to");
              expect(result.msg).toContain(testUserEmail);

              await withTimeout(client.deleteTemplates([templateId]));
              templateId = undefined;
            } catch (error) {
              if (templateId) {
                try {
                  await withTimeout(client.deleteTemplates([templateId]));
                } catch (cleanupError) {
                  console.warn(
                    `Failed to cleanup ${type} template ${templateId}:`,
                    cleanupError
                  );
                }
              }
              throw error;
            }
          });
        });
      }
    );
  });

  describe("Template Preview", () => {
    it("should preview email template with and without data", async () => {
      const templateData = createTestTemplate.email();
      let templateId: number | undefined;

      try {
        const createResponse = await withTimeout(
          client.upsertEmailTemplate(templateData)
        );
        templateId = extractTemplateId(createResponse as { msg: string });
        await waitForTemplate(templateId, "getEmailTemplate");

        // Test with custom data
        const previewWithData = await withTimeout(
          client.previewEmailTemplate({
            templateId,
            data: { dataFields: { firstName: "John" } },
          })
        );
        expect(typeof previewWithData).toBe("string");
        expect(previewWithData).toContain("Hello John!");

        // Test without data (fields render as empty strings)
        const previewNoData = await withTimeout(
          client.previewEmailTemplate({ templateId })
        );
        expect(typeof previewNoData).toBe("string");
        expect(previewNoData).toContain("Test Email");

        await withTimeout(client.deleteTemplates([templateId]));
        templateId = undefined;
      } catch (error) {
        if (templateId) {
          try {
            await withTimeout(client.deleteTemplates([templateId]));
          } catch (cleanupError) {
            logger.warn(
              `Failed to cleanup email template ${templateId}:`,
              cleanupError
            );
          }
        }
        throw error;
      }
    });

    it("should preview in-app template with and without data", async () => {
      const templateData = createTestTemplate.inapp();
      let templateId: number | undefined;

      try {
        const createResponse = await withTimeout(
          client.upsertInAppTemplate(templateData)
        );
        templateId = extractTemplateId(createResponse as { msg: string });
        await waitForTemplate(templateId, "getInAppTemplate");

        // Test with custom data
        const previewWithData = await withTimeout(
          client.previewInAppTemplate({
            templateId,
            data: { dataFields: { firstName: "Sarah" } },
          })
        );
        expect(typeof previewWithData).toBe("string");
        expect(previewWithData).toContain("Hello Sarah!");

        // Test without data
        const previewNoData = await withTimeout(
          client.previewInAppTemplate({ templateId })
        );
        expect(typeof previewNoData).toBe("string");
        expect(previewNoData).toContain("Test InApp");

        await withTimeout(client.deleteTemplates([templateId]));
        templateId = undefined;
      } catch (error) {
        if (templateId) {
          try {
            await withTimeout(client.deleteTemplates([templateId]));
          } catch (cleanupError) {
            logger.warn(
              `Failed to cleanup in-app template ${templateId}:`,
              cleanupError
            );
          }
        }
        throw error;
      }
    });
  });
});

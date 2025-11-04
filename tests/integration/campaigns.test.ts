import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import {
  cleanupTestUser,
  createTestIdentifiers,
  retryRateLimited,
  retryWithBackoff,
  uniqueId,
  withTimeout,
} from "../utils/test-helpers";

describe("Campaign Management Integration Tests", () => {
  let client: IterableClient;
  let testListId: number;
  let testTemplateId: number;
  let createdTestList = false;
  let createdTestTemplate = false;
  const { testUserEmail } = createTestIdentifiers();

  const extractTemplateId = (response: { msg: string }): number => {
    const templateIdMatch = response.msg.match(/IDs: (\d+)/);
    if (!templateIdMatch || !templateIdMatch[1]) {
      throw new Error(
        `Could not extract template ID from response: ${response.msg}`
      );
    }
    return parseInt(templateIdMatch[1]);
  };

  const createTestCampaign = async (params: {
    name: string;
    templateId: number;
    listIds?: number[];
    sendAt?: string;
  }) => {
    const createResponse = await retryRateLimited(
      () => withTimeout(client.createCampaign(params)),
      `Create campaign: ${params.name}`
    );
    return createResponse.campaignId;
  };

  const waitForCampaignState = async (
    campaignId: number,
    expectedState: string | ((state: string) => boolean),
    description?: string
  ) => {
    return retryWithBackoff(
      async () => {
        const campaign = await withTimeout(client.getCampaign({ id: campaignId }));
        const isExpectedState = typeof expectedState === "function"
          ? expectedState(campaign.campaignState)
          : campaign.campaignState === expectedState;

        if (!isExpectedState) {
          throw new Error(`Campaign still in ${campaign.campaignState} state`);
        }
        return campaign;
      },
      {
        description: description || `Campaign state to change to ${expectedState}`,
        initialIntervalMs: 1000,
        maxIntervalMs: 5000,
        timeoutMs: 30000,
      }
    );
  };

  const performCampaignAction = async <T>(
    action: () => Promise<T>,
    description: string
  ): Promise<T> => {
    return retryWithBackoff(action, {
      description,
      initialIntervalMs: 1000,
      maxIntervalMs: 5000,
      timeoutMs: 30000,
      shouldRetryOnError: (error: any) =>
        error?.message?.includes("doesn't exist") ||
        error?.message?.includes("Invalid campaign id") ||
        error?.message?.includes("is not scheduled"),
    });
  };

  const cleanupCampaign = async (campaignId: number) => {
    try {
      await client.archiveCampaigns({ campaignIds: [campaignId] });
    } catch (cleanupError) {
      console.warn(`Failed to cleanup test campaign ${campaignId}`, cleanupError);
    }
  };

  beforeAll(async () => {
    client = new IterableClient();

    const listsResponse = await withTimeout(client.getLists());
    const [existingList] = listsResponse.lists;

    if (existingList) {
      testListId = existingList.id;
    } else {
      const createResponse = await withTimeout(
        client.createList({
          name: `MCP Campaign Test List ${uniqueId()}`,
          description: "Temporary list for campaign integration testing",
        })
      );
      testListId = createResponse.listId;
      createdTestList = true;
    }

    await withTimeout(
      client.updateUser({
        email: testUserEmail,
        dataFields: { campaignTestSource: "mcp-integration-test" },
      })
    );
    await withTimeout(
      client.subscribeUserByEmail({
        subscriptionGroup: "emailList",
        subscriptionGroupId: testListId,
        userEmail: testUserEmail,
      })
    );

    const templatesResponse = await withTimeout(client.getTemplates({ limit: 1 }));
    if (templatesResponse.templates.length > 0) {
      testTemplateId = templatesResponse.templates[0]!.templateId;
    } else {
      const templateData = {
        name: uniqueId("MCP-Campaign-Test-Template"),
        clientTemplateId: uniqueId("mcp-campaign-test-template"),
        subject: "Campaign Integration Test",
        fromName: "Alex Newman",
        fromEmail: "alex.newman@iterable.com",
        html: "<html><body><h1>Test Campaign</h1><p>Hello {{firstName}}!</p><p><a href='{{unsubscribeUrl}}'>Unsubscribe</a></p></body></html>",
        plainText: "Test Campaign\n\nHello {{firstName}}!\n\nUnsubscribe: {{unsubscribeUrl}}",
        templateType: "Base" as const,
      };
      const createTemplateResponse = await withTimeout(
        client.upsertEmailTemplate(templateData)
      );
      testTemplateId = extractTemplateId(createTemplateResponse as { msg: string });
      createdTestTemplate = true;
    }
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);

    if (createdTestList) {
      try {
        await withTimeout(client.deleteList(testListId));
      } catch (error) {
        console.warn(`Failed to delete test list ${testListId}:`, error);
      }
    }

    if (createdTestTemplate) {
      try {
        await withTimeout(client.deleteTemplates([testTemplateId]));
      } catch (error) {
        console.warn(`Failed to delete test template ${testTemplateId}:`, error);
      }
    }

    client.destroy();
  });

  it("should retrieve campaigns", async () => {
    const response = await retryRateLimited(
      () => withTimeout(client.getCampaigns()),
      "Get campaigns"
    );

    expect(response).toHaveProperty("campaigns");
    expect(response).toHaveProperty("totalCampaignsCount");
    expect(Array.isArray(response.campaigns)).toBe(true);
    expect(typeof response.totalCampaignsCount).toBe("number");

    // Verify campaign structure
    if (response.campaigns.length > 0) {
      const campaign = response.campaigns[0];
      expect(campaign).toHaveProperty("id");
      expect(campaign).toHaveProperty("name");
      expect(campaign).toHaveProperty("type");
      expect(campaign).toHaveProperty("campaignState");
      if (campaign) {
        expect(["Blast", "Triggered"]).toContain(campaign.type);
        expect([
          "Draft",
          "Scheduled",
          "Running",
          "Finished",
          "Aborted",
          "Ready",
          "Archived",
        ]).toContain(campaign.campaignState);
      }
    }
  });

  it("should retrieve campaigns with pagination", async () => {
    const response = await retryRateLimited(
      () => withTimeout(client.getCampaigns({ page: 1, pageSize: 5 })),
      "Get campaigns with pagination"
    );

    expect(response).toHaveProperty("campaigns");
    expect(response).toHaveProperty("totalCampaignsCount");
    expect(Array.isArray(response.campaigns)).toBe(true);
    expect(response.campaigns.length).toBeLessThanOrEqual(5);

    // If there are more campaigns, should have nextPageUrl
    if (response.totalCampaignsCount > 5) {
      expect(response).toHaveProperty("nextPageUrl");
      expect(typeof response.nextPageUrl).toBe("string");
    }
  });

  it("should retrieve campaigns sorted by createdAt descending", async () => {
    const response = await retryRateLimited(
      () =>
        withTimeout(
          client.getCampaigns({
            page: 1,
            pageSize: 10,
            sort: { field: "createdAt", direction: "desc" },
          })
        ),
      "Get campaigns sorted by createdAt descending"
    );

    expect(response.campaigns.length).toBeGreaterThan(1);

    // Verify campaigns are sorted by createdAt in descending order
    for (let i = 0; i < response.campaigns.length - 1; i++) {
      expect(response.campaigns[i]!.createdAt).toBeGreaterThanOrEqual(
        response.campaigns[i + 1]!.createdAt
      );
    }
  });

  it("should get campaigns using default pagination", async () => {
    const response = await withTimeout(client.getCampaigns());

    expect(response).toHaveProperty("campaigns");
    expect(response).toHaveProperty("totalCampaignsCount");
    // Should return at most 10 items (default page size)
    expect(response.campaigns.length).toBeLessThanOrEqual(10);

    // Verify all campaigns have valid types and states
    if (response.campaigns.length > 0) {
      response.campaigns.forEach((campaign) => {
        expect([
          "Draft",
          "Scheduled",
          "Running",
          "Finished",
          "Aborted",
          "Ready",
          "Archived",
        ]).toContain(campaign.campaignState);
        expect(["Blast", "Triggered"]).toContain(campaign.type);
        expect(campaign).toHaveProperty("id");
        expect(campaign).toHaveProperty("name");
      });
    }
  });

  it("should get campaign metrics if campaigns exist", async () => {
    const campaignsResponse = await retryRateLimited(
      () => withTimeout(client.getCampaigns()),
      "Get campaigns for metrics test"
    );

    if (campaignsResponse.campaigns.length > 0) {
      const campaign = campaignsResponse.campaigns[0];
      if (campaign) {
        const metricsResponse = await retryRateLimited(
          () =>
            withTimeout(
              client.getCampaignMetrics({
                campaignId: campaign.id,
              })
            ),
          "Get campaign metrics"
        );

        expect(Array.isArray(metricsResponse)).toBe(true);
        expect(metricsResponse.length).toBeGreaterThanOrEqual(0);

        // If there are metrics, verify the structure
        if (metricsResponse.length > 0) {
          expect(typeof metricsResponse[0]).toBe("object");
        }
      }
    }
  });

  it("should get individual campaign details", async () => {
    // First get campaigns to find a valid campaign ID
    const campaignsResponse = await retryRateLimited(
      () => withTimeout(client.getCampaigns()),
      "Get campaigns for individual campaign test"
    );

    if (campaignsResponse.campaigns.length > 0) {
      const campaignId = campaignsResponse.campaigns[0]!.id;

      const campaignResponse = await retryRateLimited(
        () => withTimeout(client.getCampaign({ id: campaignId })),
        "Get individual campaign"
      );

      // Verify the response structure matches our schema
      expect(campaignResponse).toHaveProperty("id", campaignId);
      expect(campaignResponse).toHaveProperty("name");
      expect(campaignResponse).toHaveProperty("type");
      expect(campaignResponse).toHaveProperty("campaignState");
      expect(campaignResponse).toHaveProperty("messageMedium");
      expect(campaignResponse).toHaveProperty("createdAt");
      expect(campaignResponse).toHaveProperty("updatedAt");
      expect(campaignResponse).toHaveProperty("createdByUserId");

      // Verify enum values
      expect(["Blast", "Triggered"]).toContain(campaignResponse.type);
      expect([
        "Draft",
        "Ready",
        "Scheduled",
        "Running",
        "Finished",
        "Starting",
        "Aborted",
        "Recurring",
        "Archived",
      ]).toContain(campaignResponse.campaignState);

      // Verify timestamp types
      expect(typeof campaignResponse.createdAt).toBe("number");
      expect(typeof campaignResponse.updatedAt).toBe("number");
      expect(typeof campaignResponse.createdByUserId).toBe("string");
      expect(typeof campaignResponse.messageMedium).toBe("string");
    }
  });

  it("should get child campaigns with default pagination", async () => {
    // First get campaigns to find a recurring campaign
    const campaignsResponse = await retryRateLimited(
      () => withTimeout(client.getCampaigns()),
      "Get campaigns for child campaigns test"
    );

    // Find a recurring campaign if one exists
    const recurringCampaign = campaignsResponse.campaigns.find(
      (c) => c.campaignState === "Recurring"
    );

    if (recurringCampaign) {
      const response = await retryRateLimited(
        () => withTimeout(client.getChildCampaigns({ id: recurringCampaign.id })),
        "Get child campaigns with default pagination"
      );

      expect(response).toHaveProperty("campaigns");
      expect(response).toHaveProperty("totalCampaignsCount");
      expect(Array.isArray(response.campaigns)).toBe(true);
      expect(typeof response.totalCampaignsCount).toBe("number");

      // Should return at most 10 items (default page size)
      expect(response.campaigns.length).toBeLessThanOrEqual(10);

      // Verify campaign structure
      if (response.campaigns.length > 0) {
        const campaign = response.campaigns[0];
        expect(campaign).toHaveProperty("id");
        expect(campaign).toHaveProperty("name");
        expect(campaign).toHaveProperty("type");
        expect(campaign).toHaveProperty("campaignState");
        expect(campaign).toHaveProperty("recurringCampaignId", recurringCampaign.id);
      }
    }
  });

  it("should get child campaigns with pagination parameters", async () => {
    // First get campaigns to find a recurring campaign
    const campaignsResponse = await retryRateLimited(
      () => withTimeout(client.getCampaigns()),
      "Get campaigns for child campaigns pagination test"
    );

    // Find a recurring campaign if one exists
    const recurringCampaign = campaignsResponse.campaigns.find(
      (c) => c.campaignState === "Recurring"
    );

    if (recurringCampaign) {
      const response = await retryRateLimited(
        () =>
          withTimeout(
            client.getChildCampaigns({
              id: recurringCampaign.id,
              page: 1,
              pageSize: 5,
            })
          ),
        "Get child campaigns with pagination parameters"
      );

      expect(response).toHaveProperty("campaigns");
      expect(response).toHaveProperty("totalCampaignsCount");
      expect(Array.isArray(response.campaigns)).toBe(true);
      expect(response.campaigns.length).toBeLessThanOrEqual(5);

      // If there are more campaigns, should have nextPageUrl
      if (response.totalCampaignsCount > 5) {
        expect(response).toHaveProperty("nextPageUrl");
        expect(typeof response.nextPageUrl).toBe("string");
      }
    }
  });

  it("should get child campaigns with sorting", async () => {
    // First get campaigns to find a recurring campaign
    const campaignsResponse = await retryRateLimited(
      () => withTimeout(client.getCampaigns()),
      "Get campaigns for child campaigns sorting test"
    );

    // Find a recurring campaign if one exists
    const recurringCampaign = campaignsResponse.campaigns.find(
      (c) => c.campaignState === "Recurring"
    );

    if (recurringCampaign) {
      const response = await retryRateLimited(
        () =>
          withTimeout(
            client.getChildCampaigns({
              id: recurringCampaign.id,
              page: 1,
              pageSize: 10,
              sort: { field: "createdAt", direction: "desc" },
            })
          ),
        "Get child campaigns sorted by createdAt descending"
      );

      expect(response).toHaveProperty("campaigns");
      expect(Array.isArray(response.campaigns)).toBe(true);

      // Verify campaigns are sorted by createdAt in descending order
      if (response.campaigns.length > 1) {
        for (let i = 0; i < response.campaigns.length - 1; i++) {
          expect(response.campaigns[i]!.createdAt).toBeGreaterThanOrEqual(
            response.campaigns[i + 1]!.createdAt
          );
        }
      }
    }
  });

  it("should create and archive a test campaign", async () => {
    const campaignName = uniqueId("MCP-Test-Campaign");
    const campaignId = await createTestCampaign({
      name: campaignName,
      templateId: testTemplateId,
    });

    try {
      const campaign = await retryRateLimited(
        () => withTimeout(client.getCampaign({ id: campaignId })),
        "Get created campaign"
      );

      expect(campaign).toHaveProperty("id", campaignId);
      expect(campaign).toHaveProperty("name", campaignName);

      const archiveResponse = await retryRateLimited(
        () => withTimeout(client.archiveCampaigns({ campaignIds: [campaignId] })),
        "Archive test campaign"
      );

      expect(archiveResponse).toHaveProperty("success");
      expect(archiveResponse).toHaveProperty("failed");
      expect(archiveResponse.success).toContain(campaignId);
      expect(archiveResponse.failed).toHaveLength(0);

      const archivedCampaign = await retryRateLimited(
        () => withTimeout(client.getCampaign({ id: campaignId })),
        "Get archived campaign"
      );

      expect(archivedCampaign.campaignState).toBe("Archived");
    } catch (error) {
      await cleanupCampaign(campaignId);
      throw error;
    }
  }, 60000);

  it("should create, schedule, and cancel a blast campaign", async () => {
    const campaignName = uniqueId("MCP-Test-Schedule");

    // Schedule for 24 hours in the future (YYYY-MM-DD HH:MM:SS format)
    const sendAtDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const sendAt = sendAtDate.toISOString().replace('T', ' ').substring(0, 19);

    const campaignId = await createTestCampaign({
      name: campaignName,
      templateId: testTemplateId,
      listIds: [testListId],
      sendAt,
    });

    try {
      const campaign = await retryRateLimited(
        () => withTimeout(client.getCampaign({ id: campaignId })),
        "Get created blast campaign"
      );

      expect(campaign.type).toBe("Blast");
      expect(campaign.campaignState).toBe("Scheduled");

      const cancelResponse = await performCampaignAction(
        () => withTimeout(client.cancelCampaign({ campaignId })),
        "Cancel scheduled campaign"
      );

      expect(cancelResponse).toHaveProperty("msg");
      expect(cancelResponse).toHaveProperty("code", "Success");

      // Cancel returns campaign to "Ready" state
      const cancelledCampaign = await waitForCampaignState(
        campaignId,
        (state) => state !== "Scheduled",
        "Campaign state to change from Scheduled to Ready"
      );

      expect(cancelledCampaign.campaignState).toBe("Ready");
      expect(cancelledCampaign.startAt).toBeUndefined();
    } finally {
      await cleanupCampaign(campaignId);
    }
  }, 60000);

  it("should archive multiple campaigns at once", async () => {
    const campaignId1 = await createTestCampaign({
      name: uniqueId("MCP-Test-Bulk-1"),
      templateId: testTemplateId,
    });

    const campaignId2 = await createTestCampaign({
      name: uniqueId("MCP-Test-Bulk-2"),
      templateId: testTemplateId,
    });

    try {
      const archiveResponse = await retryRateLimited(
        () =>
          withTimeout(
            client.archiveCampaigns({ campaignIds: [campaignId1, campaignId2] })
          ),
        "Archive multiple campaigns"
      );

      expect(archiveResponse.success).toContain(campaignId1);
      expect(archiveResponse.success).toContain(campaignId2);
      expect(archiveResponse.failed).toHaveLength(0);

      const campaign1 = await retryRateLimited(
        () => withTimeout(client.getCampaign({ id: campaignId1 })),
        "Get first archived campaign"
      );
      const campaign2 = await retryRateLimited(
        () => withTimeout(client.getCampaign({ id: campaignId2 })),
        "Get second archived campaign"
      );

      expect(campaign1.campaignState).toBe("Archived");
      expect(campaign2.campaignState).toBe("Archived");
    } catch (error) {
      await cleanupCampaign(campaignId1);
      await cleanupCampaign(campaignId2);
      throw error;
    }
  }, 60000);

  it("should abort a campaign", async () => {
    const campaignId = await createTestCampaign({
      name: uniqueId("MCP-Test-Abort"),
      templateId: testTemplateId,
    });

    try {
      const abortResponse = await performCampaignAction(
        () => withTimeout(client.abortCampaign({ campaignId })),
        "Abort campaign"
      );

      expect(abortResponse).toHaveProperty("msg");
      expect(abortResponse).toHaveProperty("code", "Success");

      const abortedCampaign = await waitForCampaignState(campaignId, "Aborted");

      expect(abortedCampaign.campaignState).toBe("Aborted");
    } finally {
      await cleanupCampaign(campaignId);
    }
  }, 60000);

  it("should activate and deactivate a triggered campaign", async () => {
    // No listIds = Triggered campaign
    const campaignId = await createTestCampaign({
      name: uniqueId("MCP-Test-Triggered"),
      templateId: testTemplateId,
    });

    try {
      const campaign = await retryRateLimited(
        () => withTimeout(client.getCampaign({ id: campaignId })),
        "Get created triggered campaign"
      );

      expect(campaign.type).toBe("Triggered");

      const activateResponse = await performCampaignAction(
        () => withTimeout(client.activateTriggeredCampaign({ campaignId })),
        "Activate triggered campaign"
      );

      expect(activateResponse).toHaveProperty("msg");
      expect(activateResponse).toHaveProperty("code", "Success");

      const activatedCampaign = await waitForCampaignState(campaignId, "Running");

      expect(activatedCampaign.campaignState).toBe("Running");

      const deactivateResponse = await performCampaignAction(
        () => withTimeout(client.deactivateTriggeredCampaign({ campaignId })),
        "Deactivate triggered campaign"
      );

      expect(deactivateResponse).toHaveProperty("msg");
      expect(deactivateResponse).toHaveProperty("code", "Success");

      // Deactivated triggered campaigns go to "Finished"
      const deactivatedCampaign = await waitForCampaignState(
        campaignId,
        (state) => state !== "Running",
        "Campaign state to change from Running"
      );

      expect(deactivatedCampaign.campaignState).toBe("Finished");
    } finally {
      await cleanupCampaign(campaignId);
    }
  }, 60000);

  it("should trigger a campaign", async () => {
    const campaignId = await createTestCampaign({
      name: uniqueId("MCP-Test-Trigger"),
      templateId: testTemplateId,
    });

    try {
      // Must activate first (campaign must be Running to trigger)
      await performCampaignAction(
        () => withTimeout(client.activateTriggeredCampaign({ campaignId })),
        "Activate triggered campaign"
      );

      await waitForCampaignState(campaignId, "Running");

      const triggerResponse = await performCampaignAction(
        () =>
          withTimeout(
            client.triggerCampaign({
              campaignId,
              listIds: [testListId],
              dataFields: { testSource: "mcp-integration-test" },
            })
          ),
        "Trigger campaign"
      );

      expect(triggerResponse).toHaveProperty("msg");
      expect(triggerResponse).toHaveProperty("code", "Success");
    } finally {
      await cleanupCampaign(campaignId);
    }
  }, 60000);

  it("should send a scheduled campaign immediately", async () => {
    const sendAtDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const sendAt = sendAtDate.toISOString().replace('T', ' ').substring(0, 19);

    const campaignId = await createTestCampaign({
      name: uniqueId("MCP-Test-Send"),
      templateId: testTemplateId,
      listIds: [testListId],
      sendAt,
    });

    try {
      const campaign = await retryRateLimited(
        () => withTimeout(client.getCampaign({ id: campaignId })),
        "Get scheduled campaign"
      );
      expect(campaign.campaignState).toBe("Scheduled");

      const sendResponse = await performCampaignAction(
        () => withTimeout(client.sendCampaign({ campaignId })),
        "Send scheduled campaign immediately"
      );

      expect(sendResponse).toHaveProperty("msg");
      expect(sendResponse).toHaveProperty("code", "Success");
    } finally {
      await cleanupCampaign(campaignId);
    }
  }, 60000);
});

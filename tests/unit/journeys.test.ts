import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import { IterableClient } from "../../src/client";
import { IterableResponseValidationError } from "../../src/errors.js";
import {
  GetJourneyDslGraphParamsSchema,
  JourneyDslSelectionSchema,
} from "../../src/types/journeys.js";
import { createMockClient } from "../utils/test-helpers";

const schemaManifest = {
  version: "0.1",
  schemaEndpoint: "/api/journeys/dsl/schema",
};

const dynamicTileData = {
  campaignId: 5001,
  templateId: 8002,
  searchCombo: {
    combinator: "And",
    searchQueries: [
      {
        dataType: "user",
        searchCombo: { combinator: "Or", searchQueries: [] },
      },
    ],
  },
  channels: {
    Email: { campaignId: 11, templateId: 21 },
    Push: { campaignId: 12 },
  },
  opaqueBlob: { nested: { stillHere: true, count: 3 } },
  extraFutureField: "keep-me",
};

function createDslDocument(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "0.1",
    journey: {
      journeyId: 42,
      name: "Welcome Journey",
      description: "Onboarding",
      status: "Running",
      journeyType: "Published",
      createdAt: "2024-01-02T03:04:05.000Z",
      updatedAt: "2024-02-03T04:05:06.000Z",
      simultaneousLimit: 1,
      lifetimeLimit: null,
      triggerEventNames: ["signup"],
      exitRules: [
        {
          id: "exit-1",
          status: "enabled",
          source: "global",
          triggerRule: {
            ruleType: "And",
            eventName: null,
            searchQuery: {
              combinator: "And",
              extraNested: { keep: true },
            },
            subRules: [
              {
                ruleType: "CustomEventTrigger",
                eventName: "unsubscribe",
                searchQuery: null,
                subRules: null,
              },
            ],
          },
          sendToJourneyId: 99,
          entityRefs: [
            {
              field: "sendToJourneyId",
              entityType: "journey",
              id: 99,
            },
          ],
        },
      ],
      conversionGoals: [
        {
          id: 7,
          isActive: true,
          conversions: [
            {
              eventName: "purchase",
              attributionMode: "LastTouch",
              attributionPeriodHours: 24,
            },
          ],
        },
      ],
      labelIds: [10, 20],
      isArchived: false,
    },
    startNodeId: 100,
    nodes: [
      {
        nodeId: 100,
        nodeType: "ReceivedApiTriggerTrigger",
        title: "Start",
        tileData: {},
        entityRefs: [],
      },
      {
        nodeId: 101,
        nodeType: "SendEmailAction",
        title: "Send",
        tileData: dynamicTileData,
        entityRefs: [
          {
            field: "campaignId",
            entityType: "campaign",
            id: 5001,
            path: "channels.Email.campaignId",
          },
        ],
        createdAt: "2024-01-02T03:04:05.000Z",
        updatedAt: null,
      },
    ],
    edges: [
      {
        srcNodeId: 100,
        destNodeId: 101,
        outputIndex: 0,
        label: "entered",
      },
    ],
    completeness: {
      requiredFieldsPresent: true,
      issues: [],
    },
    schema: schemaManifest,
    ...overrides,
  };
}

function createGraphResponse(overrides: Record<string, unknown> = {}) {
  return {
    journeys: [createDslDocument()],
    errors: [],
    schema: schemaManifest,
    ...overrides,
  };
}

describe("Journeys", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getJourneys", () => {
    it("should build pagination query parameters", async () => {
      const mockResponse = {
        data: {
          journeys: [],
          totalJourneysCount: 5,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getJourneys({ page: 2, pageSize: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/journeys?page=2&pageSize=10"
      );
    });

    it("should build array query parameters for state filter", async () => {
      const mockResponse = {
        data: {
          journeys: [],
          totalJourneysCount: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getJourneys({ state: ["Archived", "Paused"] });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/journeys?page=1&pageSize=10&state=Archived&state=Paused"
      );
    });

    it("should handle no parameters with default pagination", async () => {
      const mockResponse = {
        data: {
          journeys: [],
          totalJourneysCount: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getJourneys();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/journeys?page=1&pageSize=10"
      );
    });

    it("should build combined pagination and filter parameters", async () => {
      const mockResponse = {
        data: {
          journeys: [],
          totalJourneysCount: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getJourneys({
        page: 3,
        pageSize: 25,
        state: ["Archived"],
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/journeys?page=3&pageSize=25&state=Archived"
      );
    });

    it("should return proper response structure", async () => {
      const mockJourney = {
        id: 123,
        name: "Test Journey",
        description: "Test description",
        enabled: true,
        isArchived: false,
        journeyType: "Published",
        triggerEventNames: ["testEvent"],
        createdAt: 1673633396379,
        updatedAt: 1673633396567,
        creatorUserId: "test@example.com",
      };
      const mockResponse = {
        data: {
          journeys: [mockJourney],
          totalJourneysCount: 1,
          nextPageUrl: "https://api.iterable.com/api/journeys?page=2",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getJourneys();

      expect(result).toHaveProperty("journeys");
      expect(result).toHaveProperty("totalJourneysCount");
      expect(result).toHaveProperty("nextPageUrl");
      expect(Array.isArray(result.journeys)).toBe(true);
      expect(result.journeys).toHaveLength(1);
      expect(result.journeys[0]).toEqual(mockJourney);
      expect(result.totalJourneysCount).toBe(1);
    });

    it("should preserve nested draft metadata", async () => {
      const mockJourney = {
        id: 123,
        name: "Published Journey",
        description: "Has a draft",
        enabled: true,
        isArchived: false,
        journeyType: "Published",
        createdAt: 1673633396379,
        updatedAt: 1673633396567,
        creatorUserId: "owner@example.com",
        draft: {
          id: 456,
          createdAt: 1673633400000,
          updatedAt: 1673633500000,
          name: "Draft name",
          creatorUserId: "editor@example.com",
        },
      };
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          journeys: [mockJourney],
          totalJourneysCount: 1,
        },
      });

      const result = await client.getJourneys();

      expect(result.journeys[0]?.draft).toEqual(mockJourney.draft);
    });

    it("should preserve a null draft field", async () => {
      const mockJourney = {
        id: 123,
        name: "Published Journey",
        enabled: true,
        isArchived: false,
        journeyType: "Published",
        createdAt: 1673633396379,
        updatedAt: 1673633396567,
        draft: null,
      };
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          journeys: [mockJourney],
          totalJourneysCount: 1,
        },
      });

      const result = await client.getJourneys();

      expect(result.journeys[0]?.draft).toBeNull();
    });

    it("should handle pagination metadata properly", async () => {
      const mockResponse = {
        data: {
          journeys: [],
          totalJourneysCount: 100,
          nextPageUrl: "https://api.iterable.com/api/journeys?page=3",
          previousPageUrl: "https://api.iterable.com/api/journeys?page=1",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getJourneys({ page: 2 });

      expect(result.totalJourneysCount).toBe(100);
      expect(result.nextPageUrl).toBe(
        "https://api.iterable.com/api/journeys?page=3"
      );
      expect(result.previousPageUrl).toBe(
        "https://api.iterable.com/api/journeys?page=1"
      );
    });
  });

  describe("getJourneyDslSchema", () => {
    const manifest = {
      kind: "tileTypeManifest",
      version: "0.1",
      tileSchemas: [
        {
          tileType: "SendEmailAction",
          category: "action",
          numOutputs: 1,
          description: "Sends an email",
          tileDataSchema: {
            type: "object",
            properties: {
              campaignId: {
                type: "integer",
                format: "int64",
                entityType: "campaign",
              },
              searchCombo: {
                type: "object",
                "x-iterable-opaque": true,
                extraVendorKey: { nested: true },
              },
            },
            required: [],
            extraSchemaKey: "keep-me",
          },
          outputs: [
            {
              index: 0,
              label: "sent",
              description: "Email sent",
            },
          ],
        },
        {
          tileType: "ABSplitFilter",
          category: "filter",
          numOutputs: "dynamic",
          description: "A/B split",
          tileDataSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
      ],
      entityTypes: [{ entityType: "campaign" }, { entityType: "template" }],
    };

    it("should GET the schema endpoint", async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: manifest });

      const result = await client.getJourneyDslSchema();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/journeys/dsl/schema"
      );
      expect(result.kind).toBe("tileTypeManifest");
      expect(result.version).toBe("0.1");
    });

    it("should preserve opaque and evolving nested schema blobs", async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: manifest });

      const result = await client.getJourneyDslSchema();
      const sendEmail = result.tileSchemas[0];

      expect(sendEmail?.tileDataSchema).toEqual(
        manifest.tileSchemas[0]?.tileDataSchema
      );
      expect(
        (sendEmail?.tileDataSchema.properties as Record<string, unknown>)
          .searchCombo
      ).toEqual({
        type: "object",
        "x-iterable-opaque": true,
        extraVendorKey: { nested: true },
      });
      expect(sendEmail?.numOutputs).toBe(1);
      expect(result.tileSchemas[1]?.numOutputs).toBe("dynamic");
    });
  });

  describe("getJourneyDslGraph", () => {
    it("should POST the exact URL and body", async () => {
      const params = {
        journeys: [
          { workflowId: 42, workflowType: "Published" as const },
          { workflowId: 43, workflowType: "Draft" as const },
        ],
      };
      mockAxiosInstance.post.mockResolvedValue({
        data: createGraphResponse(),
      });

      await client.getJourneyDslGraph(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/journeys/dsl/graph",
        params
      );
    });

    it("should POST omitted workflowType without rewriting the body", async () => {
      const params = { journeys: [{ workflowId: 42 }] };
      mockAxiosInstance.post.mockResolvedValue({
        data: createGraphResponse(),
      });

      await client.getJourneyDslGraph(params);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/journeys/dsl/graph",
        params
      );
    });

    it("should preserve dynamic tileData and opaque nested JSON", async () => {
      const response = createGraphResponse();
      mockAxiosInstance.post.mockResolvedValue({ data: response });

      const result = await client.getJourneyDslGraph({
        journeys: [{ workflowId: 42 }],
      });

      expect(result.journeys[0]?.nodes[1]?.tileData).toEqual(dynamicTileData);
      expect(
        result.journeys[0]?.journey.exitRules[0]?.triggerRule.searchQuery
      ).toEqual({
        combinator: "And",
        extraNested: { keep: true },
      });
      expect(result.schema).toEqual(schemaManifest);
    });

    it("should return partial success with journeys and errors", async () => {
      const response = createGraphResponse({
        errors: [
          {
            workflowId: 43,
            workflowType: "Draft",
            error: "NotFound",
            message: "Journey not found for workflowId=43 workflowType=Draft",
          },
        ],
      });
      mockAxiosInstance.post.mockResolvedValue({ data: response });

      const result = await client.getJourneyDslGraph({
        journeys: [
          { workflowId: 42, workflowType: "Published" },
          { workflowId: 43, workflowType: "Draft" },
        ],
      });

      expect(result.journeys).toHaveLength(1);
      expect(result.journeys[0]?.journey.journeyId).toBe(42);
      expect(result.errors).toEqual(response.errors);
    });

    it("should accept an errors-only HTTP 200 body", async () => {
      const response = {
        journeys: [],
        errors: [
          {
            workflowId: 42,
            workflowType: "Published",
            error: "InvalidGraph",
            message: "Journey 42 graph is invalid (1 issue(s))",
          },
        ],
        schema: schemaManifest,
      };
      mockAxiosInstance.post.mockResolvedValue({ data: response });

      const result = await client.getJourneyDslGraph({
        journeys: [{ workflowId: 42 }],
      });

      expect(result.journeys).toEqual([]);
      expect(result.errors[0]?.error).toBe("InvalidGraph");
    });

    it("should throw IterableResponseValidationError for an invalid envelope", async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: { journeys: [] },
      });

      await expect(
        client.getJourneyDslGraph({ journeys: [{ workflowId: 42 }] })
      ).rejects.toBeInstanceOf(IterableResponseValidationError);
    });
  });

  describe("GetJourneyDslGraphParamsSchema", () => {
    it("should default workflowType to Published", () => {
      const parsed = JourneyDslSelectionSchema.parse({ workflowId: 42 });

      expect(parsed).toEqual({
        workflowId: 42,
        workflowType: "Published",
      });
    });

    it("should accept Draft and Published selections of the same workflowId", () => {
      const parsed = GetJourneyDslGraphParamsSchema.parse({
        journeys: [
          { workflowId: 42, workflowType: "Published" },
          { workflowId: 42, workflowType: "Draft" },
        ],
      });

      expect(parsed.journeys).toHaveLength(2);
    });

    it("should accept 50 unique selections", () => {
      const journeys = Array.from({ length: 50 }, (_, index) => ({
        workflowId: index + 1,
      }));

      expect(() =>
        GetJourneyDslGraphParamsSchema.parse({ journeys })
      ).not.toThrow();
    });

    it("should reject an empty journeys array", () => {
      expect(() =>
        GetJourneyDslGraphParamsSchema.parse({ journeys: [] })
      ).toThrow();
    });

    it("should reject more than 50 selections", () => {
      const journeys = Array.from({ length: 51 }, (_, index) => ({
        workflowId: index + 1,
      }));

      expect(() =>
        GetJourneyDslGraphParamsSchema.parse({ journeys })
      ).toThrow();
    });

    it("should reject duplicate (workflowType, workflowId) selections after defaulting", () => {
      const duplicateResult = GetJourneyDslGraphParamsSchema.safeParse({
        journeys: [{ workflowId: 42 }, { workflowId: 42 }],
      });

      expect(duplicateResult.success).toBe(false);
      if (!duplicateResult.success) {
        expect(duplicateResult.error.issues[0]?.message).toBe(
          "journeys contains duplicate (workflowType, workflowId) selections"
        );
      }

      expect(() =>
        GetJourneyDslGraphParamsSchema.parse({
          journeys: [
            { workflowId: 42 },
            { workflowId: 42, workflowType: "Published" },
          ],
        })
      ).toThrow();
    });

    it("should reject non-positive workflow IDs", () => {
      expect(() =>
        GetJourneyDslGraphParamsSchema.parse({
          journeys: [{ workflowId: 0 }],
        })
      ).toThrow();

      expect(() =>
        GetJourneyDslGraphParamsSchema.parse({
          journeys: [{ workflowId: -1 }],
        })
      ).toThrow();

      expect(() =>
        GetJourneyDslGraphParamsSchema.parse({
          journeys: [{ workflowId: 1.5 }],
        })
      ).toThrow();
    });

    it("should reject an invalid workflowType", () => {
      expect(() =>
        GetJourneyDslGraphParamsSchema.parse({
          journeys: [{ workflowId: 42, workflowType: "Live" }],
        })
      ).toThrow();
    });
  });
});

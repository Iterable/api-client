import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import type {
  GetJourneyDslGraphResponse,
  Journey,
  JourneyDslSelection,
  JourneyDslTileTypeManifest,
} from "../../src/types/journeys";
// import { expectValidationError } from "../utils/error-matchers";
import {
  cleanupTestUser,
  createTestIdentifiers,
  withTimeout,
} from "../utils/test-helpers";

describe("Journeys Integration Tests", () => {
  let client: IterableClient;
  const { testUserEmail } = createTestIdentifiers();

  beforeAll(async () => {
    client = new IterableClient();
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);
    client.destroy();
  });

  it("should get journeys", async () => {
    const result = await withTimeout(client.getJourneys());

    expect(result).toBeDefined();
    expect(result.journeys).toBeDefined();
    expect(Array.isArray(result.journeys)).toBe(true);
    expect(result).toHaveProperty("totalJourneysCount");
    expect(typeof result.totalJourneysCount).toBe("number");
  });

  it("should get journeys with pagination", async () => {
    const result = await withTimeout(
      client.getJourneys({ page: 1, pageSize: 5 })
    );

    expect(result).toBeDefined();
    expect(result.journeys).toBeDefined();
    expect(Array.isArray(result.journeys)).toBe(true);
    expect(result).toHaveProperty("totalJourneysCount");
    expect(typeof result.totalJourneysCount).toBe("number");

    // Should not return more than the page size
    expect(result.journeys.length).toBeLessThanOrEqual(5);

    // Verify journey structure if any journeys exist
    if (result.journeys.length > 0) {
      const journey = result.journeys[0];
      expect(journey).toHaveProperty("id");
      expect(journey).toHaveProperty("name");
      expect(journey).toHaveProperty("journeyType");
      expect(journey).toHaveProperty("enabled");
      expect(journey).toHaveProperty("isArchived");
    }
  });

  it("should get journeys with state filter", async () => {
    const result = await withTimeout(
      client.getJourneys({ state: ["Archived"], pageSize: 3 })
    );

    expect(result).toBeDefined();
    expect(result.journeys).toBeDefined();
    expect(Array.isArray(result.journeys)).toBe(true);
    expect(result).toHaveProperty("totalJourneysCount");

    // Should not return more than the page size
    expect(result.journeys.length).toBeLessThanOrEqual(3);
  });

  it("should navigate between pages correctly", async () => {
    const firstPage = await withTimeout(
      client.getJourneys({ page: 1, pageSize: 2 })
    );

    expect(firstPage).toHaveProperty("totalJourneysCount");

    // If there are enough results for pagination, test navigation
    if (firstPage.totalJourneysCount > 2) {
      const secondPage = await withTimeout(
        client.getJourneys({ page: 2, pageSize: 2 })
      );

      // Verify different results between pages
      if (firstPage.journeys.length > 0 && secondPage.journeys.length > 0) {
        expect(firstPage.journeys[0]?.id).not.toBe(secondPage.journeys[0]?.id);
      }
    }
  });

  it("should get journeys sorted by createdAt descending", async () => {
    const result = await withTimeout(
      client.getJourneys({
        page: 1,
        pageSize: 10,
        sort: { field: "createdAt", direction: "desc" },
      })
    );

    expect(result.journeys.length).toBeGreaterThan(1);

    // Verify journeys are sorted by createdAt in descending order
    for (let i = 0; i < result.journeys.length - 1; i++) {
      expect(result.journeys[i]!.createdAt).toBeGreaterThanOrEqual(
        result.journeys[i + 1]!.createdAt
      );
    }
  });

  it("should validate journey trigger parameters", async () => {
    // Test that invalid workflow ID returns an error
    await expect(
      client.triggerJourney({ workflowId: 0, email: testUserEmail })
    ).rejects.toHaveProperty("statusCode", 400);
  });
});

const describeJourneyDsl =
  process.env.ITERABLE_ENABLE_JOURNEY_DSL === "true" ? describe : describe.skip;

function getJourneyDslSelections(
  journeys: Journey[]
): Required<JourneyDslSelection>[] {
  return journeys
    .flatMap((journey): Required<JourneyDslSelection>[] => {
      if (journey.journeyType === "Draft") {
        return [{ workflowId: journey.id, workflowType: "Draft" }];
      }

      const published: Required<JourneyDslSelection> = {
        workflowId: journey.id,
        workflowType: "Published",
      };
      const draft = journey.draft
        ? [
            {
              workflowId: journey.draft.id,
              workflowType: "Draft" as const,
            },
          ]
        : [];
      return [published, ...draft];
    })
    .slice(0, 10);
}

describeJourneyDsl("Journey DSL Integration Tests", () => {
  let client: IterableClient;
  let dslSchema: JourneyDslTileTypeManifest;
  let graphResponse: GetJourneyDslGraphResponse;
  let successfulSelection: Required<JourneyDslSelection>;

  beforeAll(async () => {
    client = new IterableClient();
    dslSchema = await withTimeout(client.getJourneyDslSchema());

    const firstPage = await withTimeout(
      client.getJourneys({ page: 1, pageSize: 50 })
    );
    const totalPages = Math.max(
      1,
      Math.ceil(firstPage.totalJourneysCount / 50)
    );
    const sampledPages = [1, Math.ceil(totalPages / 2), totalPages].filter(
      (page, index, pages) => pages.indexOf(page) === index
    );

    const responses: GetJourneyDslGraphResponse[] = [];
    for (const pageNumber of sampledPages) {
      const page =
        pageNumber === 1
          ? firstPage
          : await withTimeout(
              client.getJourneys({ page: pageNumber, pageSize: 50 })
            );
      const selections = getJourneyDslSelections(page.journeys);
      if (selections.length > 0) {
        responses.push(
          await withTimeout(client.getJourneyDslGraph({ journeys: selections }))
        );
      }
    }

    if (responses.length === 0) {
      throw new Error(
        "Journey DSL integration testing requires at least one journey"
      );
    }

    graphResponse = {
      journeys: responses.flatMap(({ journeys }) => journeys),
      errors: responses.flatMap(({ errors }) => errors),
      schema: responses[0]!.schema,
    };
    const document = graphResponse.journeys[0];
    if (!document) {
      const errors = graphResponse.errors
        .map(({ workflowId, workflowType, error }) =>
          [workflowType, workflowId, error].join(":")
        )
        .join(", ");
      throw new Error(
        `Journey DSL integration testing requires at least one readable graph; errors: ${errors}`
      );
    }

    successfulSelection = {
      workflowId: document.journey.journeyId,
      workflowType:
        document.journey.journeyType === "Draft" ? "Draft" : "Published",
    };
  });

  afterAll(() => {
    client.destroy();
  });

  it("should retrieve the live tile schema", () => {
    expect(dslSchema.kind).toBe("tileTypeManifest");
    expect(dslSchema.version).toBe("0.1");
    expect(dslSchema.tileSchemas.length).toBeGreaterThan(0);
    expect(dslSchema.entityTypes.length).toBeGreaterThan(0);
  });

  it("should retrieve a structurally valid graph from discovered journeys", () => {
    expect(graphResponse.journeys.length).toBeGreaterThan(0);

    graphResponse.journeys.forEach((document) => {
      const nodeIds = new Set(document.nodes.map(({ nodeId }) => nodeId));

      expect(document.schemaVersion).toBe("0.1");
      expect(document.schema.schemaEndpoint).toBe("/api/journeys/dsl/schema");
      expect(document.nodes.length).toBeGreaterThan(0);
      expect(nodeIds.has(document.startNodeId)).toBe(true);
      expect(typeof document.completeness.requiredFieldsPresent).toBe(
        "boolean"
      );
      document.edges.forEach(({ srcNodeId, destNodeId }) => {
        expect(nodeIds.has(srcNodeId)).toBe(true);
        expect(nodeIds.has(destNodeId)).toBe(true);
      });
      document.nodes.forEach(({ tileData }) => {
        expect(tileData).toEqual(expect.any(Object));
      });
    });
  });

  it("should provide a tile schema for every sampled graph node type", () => {
    const schemaTileTypes = new Set(
      dslSchema.tileSchemas.map(({ tileType }) => tileType)
    );
    const graphNodeTypes = new Set(
      graphResponse.journeys.flatMap(({ nodes }) =>
        nodes.map(({ nodeType }) => nodeType)
      )
    );

    expect(
      [...graphNodeTypes].filter((nodeType) => !schemaTileTypes.has(nodeType))
    ).toEqual([]);
  });

  it("should return a real graph and a per-journey error in a mixed batch", async () => {
    const nonexistentWorkflowId = Number.MAX_SAFE_INTEGER;
    const response = await withTimeout(
      client.getJourneyDslGraph({
        journeys: [
          successfulSelection,
          {
            workflowId: nonexistentWorkflowId,
            workflowType: "Published",
          },
        ],
      })
    );

    expect(
      response.journeys.some(
        ({ journey }) => journey.journeyId === successfulSelection.workflowId
      )
    ).toBe(true);
    expect(response.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          workflowId: nonexistentWorkflowId,
          workflowType: "Published",
          error: "NotFound",
        }),
      ])
    );
  });
});

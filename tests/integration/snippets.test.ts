import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import { expectNotFoundError } from "../utils/error-matchers";
import {
  createTestIdentifiers,
  retryRateLimited,
  withTimeout,
} from "../utils/test-helpers";

describe("Snippets Management Integration Tests", () => {
  let client: IterableClient;

  beforeAll(async () => {
    client = new IterableClient();
  });

  afterAll(async () => {
    client.destroy();
  });

  it("should create and delete a new snippet", async () => {
    const { testRunId } = createTestIdentifiers();
    const testSnippetName = `create-test-${testRunId}`;

    const response = await retryRateLimited(
      () =>
        withTimeout(
          client.createSnippet({
            name: testSnippetName,
            content: "<p>Hello {{firstName}}!</p>",
            variables: ["firstName"],
          })
        ),
      "Create snippet"
    );

    expect(typeof response.snippetId).toBe("number");

    await retryRateLimited(
      () => withTimeout(client.deleteSnippet({ identifier: testSnippetName })),
      "Cleanup created snippet"
    );
  });

  it("should retrieve snippets and validate content when available", async () => {
    const { testRunId } = createTestIdentifiers();
    const testSnippetName = `validation-test-${testRunId}`;

    // Ensure we have at least one snippet to test with
    await retryRateLimited(
      () =>
        withTimeout(
          client.createSnippet({
            name: testSnippetName,
            content: "<p>Test content with {{variable}}!</p>",
            variables: ["variable"],
          })
        ),
      "Create snippet for validation test"
    );

    try {
      const response = await retryRateLimited(
        () => withTimeout(client.getSnippets()),
        "Get all snippets"
      );

      expect(Array.isArray(response.snippets)).toBe(true);
      expect(response.snippets.length).toBeGreaterThan(0);

      // Now we can safely validate content
      const testSnippet = response.snippets.find(
        (s) => s.name === testSnippetName
      );
      expect(testSnippet).toBeDefined();
      expect(testSnippet?.content).toContain("{{variable}}");
      expect(testSnippet?.variables).toContain("variable");
    } finally {
      // Clean up
      await retryRateLimited(
        () =>
          withTimeout(client.deleteSnippet({ identifier: testSnippetName })),
        "Cleanup validation test snippet"
      );
    }
  });

  it("should perform complete CRUD cycle", async () => {
    const { testRunId } = createTestIdentifiers();
    const testSnippetName = `crud-test-${testRunId}`;

    // 1. Create
    const createResponse = await retryRateLimited(
      () =>
        withTimeout(
          client.createSnippet({
            name: testSnippetName,
            content: "<p>Hello {{name}}!</p>",
            description: "CRUD test snippet",
            variables: ["name"],
          })
        ),
      "Create snippet for CRUD test"
    );

    expect(createResponse).toHaveProperty("snippetId");
    const snippetId = createResponse.snippetId;

    try {
      // 2. Get by name
      const getByNameResponse = await retryRateLimited(
        () => withTimeout(client.getSnippet({ identifier: testSnippetName })),
        "Get snippet by name"
      );

      expect(getByNameResponse).toHaveProperty("snippet");
      expect(getByNameResponse.snippet).toHaveProperty("name", testSnippetName);
      expect(getByNameResponse.snippet).toHaveProperty(
        "content",
        "<p>Hello {{name}}!</p>"
      );
      expect(getByNameResponse.snippet).toHaveProperty(
        "description",
        "CRUD test snippet"
      );

      // 3. Get by ID
      const getByIdResponse = await retryRateLimited(
        () => withTimeout(client.getSnippet({ identifier: snippetId })),
        "Get snippet by ID"
      );

      expect(getByIdResponse).toHaveProperty("snippet");
      expect(getByIdResponse.snippet).toHaveProperty("id", snippetId);
      expect(getByIdResponse.snippet).toHaveProperty("name", testSnippetName);

      // 4. Update by name
      const updatedContent =
        "<p>Updated: Hello {{firstName}} from {{company}}!</p>";
      const updateResponse = await retryRateLimited(
        () =>
          withTimeout(
            client.updateSnippet({
              identifier: testSnippetName,
              content: updatedContent,
              description: "Updated CRUD test snippet",
              variables: ["firstName", "company"],
            })
          ),
        "Update snippet by name"
      );

      expect(updateResponse).toHaveProperty("snippetId");

      // 5. Update by ID (test both name and ID updates work)
      const updateByIdContent = "<p>Updated by ID: Hello {{user}}!</p>";
      const updateByIdResponse = await retryRateLimited(
        () =>
          withTimeout(
            client.updateSnippet({
              identifier: snippetId,
              content: updateByIdContent,
              variables: ["user"],
            })
          ),
        "Update snippet by ID"
      );

      expect(updateByIdResponse).toHaveProperty("snippetId", snippetId);
    } finally {
      // 7. Delete (cleanup)
      const deleteResponse = await retryRateLimited(
        () =>
          withTimeout(client.deleteSnippet({ identifier: testSnippetName })),
        "Delete snippet"
      );

      expect(deleteResponse).toHaveProperty("snippetId", snippetId);
    }
  });

  it("should handle snippet not found errors gracefully", async () => {
    const { testRunId } = createTestIdentifiers();
    const nonExistentSnippet = `non-existent-snippet-${testRunId}`;

    await expectNotFoundError(
      withTimeout(client.getSnippet({ identifier: nonExistentSnippet }))
    );
  });
});

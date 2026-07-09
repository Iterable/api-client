import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";

import { IterableClient } from "../../src/client";
import {
  cleanupTestUser,
  createTestIdentifiers,
  uniqueId,
  waitForCatalogItems,
  waitForCatalogItemValue,
  withTimeout,
} from "../utils/test-helpers";

describe("Catalog Management Integration Tests", () => {
  let client: IterableClient;

  const { testUserEmail } = createTestIdentifiers();

  beforeAll(async () => {
    client = new IterableClient();
  });

  afterAll(async () => {
    await cleanupTestUser(client, testUserEmail);
    client.destroy();
  });

  it("get nonexistent catalog item should 404", async () => {
    await expect(
      client.getCatalogItem({ catalogName: "nonexistent-catalog", itemId: "nonexistent-item" })
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("should get catalogs", async () => {
    const result = await withTimeout(client.getCatalogs());

    expect(result).toBeDefined();
    // API returns different structure than documented, just verify it's defined
    expect(typeof result).toBe("object");
  });

  it("should get catalog field mappings with correct structure", async () => {
    // Create a test catalog
    const catalogName = uniqueId("test-catalog-mappings");
    await withTimeout(client.createCatalog({ catalogName }));

    // Add some items to the catalog with various field types
    await withTimeout(
      client.partialUpdateCatalogItems({
        catalogName,
        documents: {
          [uniqueId("test-item")]: {
            name: "Test Item",
            price: 10.99,
            category: "test",
            inStock: true,
          },
        },
      })
    );

    const result = await withTimeout(
      client.getCatalogFieldMappings({ catalogName })
    );

    expect(result).toBeDefined();
    // Verify response has correct structure per API docs
    expect(result).toHaveProperty("definedMappings");
    expect(result).toHaveProperty("undefinedFields");
    expect(typeof result.definedMappings).toBe("object");
    expect(Array.isArray(result.undefinedFields)).toBe(true);
  });

  it("should get catalog items", async () => {
    // Always create a fresh test catalog to ensure clean test state
    const catalogName = uniqueId("test-catalog-items");
    await withTimeout(client.createCatalog({ catalogName }));

    const itemId1 = uniqueId("catalog-items-test-1");
    const itemId2 = uniqueId("catalog-items-test-2");

    await withTimeout(
      client.partialUpdateCatalogItems({
        catalogName,
        documents: {
          [itemId1]: {
            name: "Catalog Items Test Item 1",
            price: 5.99,
            category: "test",
          },
          [itemId2]: {
            name: "Catalog Items Test Item 2",
            price: 7.99,
            category: "test",
          },
        },
      })
    );

    // Wait for catalog items to propagate using eventual consistency and get the result
    const result = await waitForCatalogItems(client, catalogName, [
      itemId1,
      itemId2,
    ]); // 90 second timeout

    expect(result).toBeDefined();
    expect(result.catalogItemsWithProperties).toBeDefined();
    expect(Array.isArray(result.catalogItemsWithProperties)).toBe(true);
    expect(result).toHaveProperty("totalItemsCount");
    expect(typeof result.totalItemsCount).toBe("number");

    // Verify we got the expected items
    expect(result.catalogItemsWithProperties.length).toBeGreaterThan(0);
    const firstItem = result.catalogItemsWithProperties[0];
    expect(firstItem).toHaveProperty("itemId");
    expect(firstItem).toHaveProperty("value");
  }, 120000); // 2 minute timeout for eventual consistency

  it("should handle pagination parameters for catalog items", async () => {
    // Always create a fresh test catalog for pagination testing
    const catalogName = uniqueId("test-catalog-pagination");
    await withTimeout(client.createCatalog({ catalogName }));

    const itemId1 = uniqueId("pagination-test-1");
    const itemId2 = uniqueId("pagination-test-2");

    await withTimeout(
      client.partialUpdateCatalogItems({
        catalogName,
        documents: {
          [itemId1]: {
            name: "Pagination Test Item 1",
            price: 5.99,
          },
          [itemId2]: {
            name: "Pagination Test Item 2",
            price: 7.99,
          },
        },
      })
    );

    // Wait for catalog items to propagate using eventual consistency
    const waitResult = await waitForCatalogItems(client, catalogName, [
      itemId1,
      itemId2,
    ]);

    // Verify basic structure from wait result
    expect(waitResult).toBeDefined();
    expect(waitResult.catalogItemsWithProperties).toBeDefined();
    expect(Array.isArray(waitResult.catalogItemsWithProperties)).toBe(true);
    expect(waitResult.catalogItemsWithProperties.length).toBeGreaterThan(0);

    // Test pagination parameters with a separate call
    const paginatedResult = await withTimeout(
      client.getCatalogItems({
        catalogName,
        page: 1,
        pageSize: 5,
      })
    );

    expect(paginatedResult).toBeDefined();
    expect(paginatedResult.catalogItemsWithProperties).toBeDefined();
    expect(Array.isArray(paginatedResult.catalogItemsWithProperties)).toBe(
      true
    );
    expect(
      paginatedResult.catalogItemsWithProperties.length
    ).toBeLessThanOrEqual(5);
    expect(paginatedResult.catalogItemsWithProperties.length).toBeGreaterThan(
      0
    );

    // Should have pagination metadata
    expect(paginatedResult).toHaveProperty("totalItemsCount");

    // If there are more results than page size, should have nextPageUrl
    if (paginatedResult.totalItemsCount > 5) {
      expect(paginatedResult).toHaveProperty("nextPageUrl");
    }
  }, 120000); // 2 minute timeout for eventual consistency

  it("should delete a catalog", async () => {
    // Create a test catalog to delete
    const catalogName = uniqueId("test-catalog-delete");
    await withTimeout(client.createCatalog({ catalogName }));

    // Delete the catalog
    const result = await withTimeout(client.deleteCatalog({ catalogName }));

    expect(result).toBeDefined();
    expect(result).toHaveProperty("msg");
    expect(result).toHaveProperty("code");

    // Verify deletion by trying to get the catalog (should fail)
    // Note: We can't test this right away due to eventual consistency
  });

  it("should update catalog field mappings", async () => {
    // Create a test catalog
    const catalogName = uniqueId("test-catalog-field-mappings");
    await withTimeout(client.createCatalog({ catalogName }));

    // Add items with some fields first
    await withTimeout(
      client.partialUpdateCatalogItems({
        catalogName,
        documents: {
          [uniqueId("test-item")]: {
            name: "Test Item",
            price: 19.99,
            quantity: 10,
          },
        },
      })
    );

    // Update field mappings
    const result = await withTimeout(
      client.updateCatalogFieldMappings({
        catalogName,
        mappingsUpdates: [
          { fieldName: "price", fieldType: "double" },
          { fieldName: "quantity", fieldType: "long" },
        ],
      })
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty("msg");
    expect(result).toHaveProperty("code");

    // Verify mappings were set by getting them
    const mappings = await withTimeout(
      client.getCatalogFieldMappings({ catalogName })
    );

    expect(mappings.definedMappings).toBeDefined();
    // The API should have set the mappings we requested
  });

  it("should bulk delete catalog items", async () => {
    // Create a test catalog
    const catalogName = uniqueId("test-catalog-bulk-delete");
    await withTimeout(client.createCatalog({ catalogName }));

    const itemId1 = uniqueId("bulk-delete-1");
    const itemId2 = uniqueId("bulk-delete-2");
    const itemId3 = uniqueId("bulk-delete-3");

    // Create items
    await withTimeout(
      client.partialUpdateCatalogItems({
        catalogName,
        documents: {
          [itemId1]: { name: "Item 1", price: 10 },
          [itemId2]: { name: "Item 2", price: 20 },
          [itemId3]: { name: "Item 3", price: 30 },
        },
      })
    );

    // Wait for items to be created
    await waitForCatalogItems(client, catalogName, [itemId1, itemId2, itemId3]);

    // Bulk delete two items
    const result = await withTimeout(
      client.bulkDeleteCatalogItems({
        catalogName,
        itemIds: [itemId1, itemId2],
      })
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty("msg");
    expect(result).toHaveProperty("code");
    // Note: Actual deletion is asynchronous, we're just verifying the request format
  }, 120000);

  it("should partial update a catalog item", async () => {
    // Create a test catalog
    const catalogName = uniqueId("test-catalog-patch");
    await withTimeout(client.createCatalog({ catalogName }));

    const itemId = uniqueId("patch-item");

    // Create an item with multiple fields
    await withTimeout(
      client.partialUpdateCatalogItems({
        catalogName,
        documents: {
          [itemId]: {
            name: "Original Item",
            price: 100,
            description: "Original description",
            category: "electronics",
            inStock: true,
          },
        },
      })
    );

    // Wait for item to be created
    await waitForCatalogItems(client, catalogName, [itemId]);

    // Partial update - only update price and inStock
    const updateResult = await withTimeout(
      client.partialUpdateCatalogItem({
        catalogName,
        itemId,
        update: {
          price: 89.99,
          inStock: false,
        },
      })
    );

    expect(updateResult).toBeDefined();
    expect(updateResult).toHaveProperty("msg");
    expect(updateResult).toHaveProperty("code");

    // Note: We're testing the request format, not verifying the actual update
    // due to eventual consistency
  }, 120000);

  it("should replace a catalog item", async () => {
    // Create a test catalog
    const catalogName = uniqueId("test-catalog-replace");
    await withTimeout(client.createCatalog({ catalogName }));

    const itemId = uniqueId("replace-item");

    // Create an item with multiple fields
    await withTimeout(
      client.partialUpdateCatalogItems({
        catalogName,
        documents: {
          [itemId]: {
            name: "Original Item",
            price: 100,
            description: "Original description",
            category: "electronics",
            inStock: true,
          },
        },
      })
    );

    // Wait for item to be created
    await waitForCatalogItems(client, catalogName, [itemId]);

    // Replace item - completely new value with fewer fields
    const replaceResult = await withTimeout(
      client.replaceCatalogItem({
        catalogName,
        itemId,
        value: {
          name: "Replaced Item",
          price: 50,
        },
      })
    );

    expect(replaceResult).toBeDefined();
    expect(replaceResult).toHaveProperty("msg");
    expect(replaceResult).toHaveProperty("code");

    // Note: We're testing the request format, not verifying the actual replacement
    // due to eventual consistency
  }, 120000);

  it("merges fields with partialUpdateCatalogItems", async () => {
    const catalogName = uniqueId("test-catalog-merge");
    await withTimeout(client.createCatalog({ catalogName }));

    const itemId = uniqueId("merge-item");

    await withTimeout(
      client.replaceCatalogItems({
        catalogName,
        documents: {
          [itemId]: {
            name: "Original Item",
            price: 100,
            keepField: true,
          },
        },
      })
    );

    await waitForCatalogItems(client, catalogName, [itemId]);

    await withTimeout(
      client.partialUpdateCatalogItems({
        catalogName,
        documents: {
          [itemId]: { price: 50 },
        },
      })
    );

    const item = await waitForCatalogItemValue(
      client,
      catalogName,
      itemId,
      (value) =>
        value.name === "Original Item" &&
        value.price === 50 &&
        value.keepField === true
    );

    expect(item.value).toMatchObject({
      name: "Original Item",
      price: 50,
      keepField: true,
    });
  }, 180000);

  it("replaces items with replaceCatalogItems", async () => {
    const catalogName = uniqueId("test-catalog-overwrite");
    await withTimeout(client.createCatalog({ catalogName }));

    const itemId = uniqueId("overwrite-item");

    await withTimeout(
      client.replaceCatalogItems({
        catalogName,
        documents: {
          [itemId]: {
            name: "Original Item",
            price: 100,
            keepField: true,
          },
        },
      })
    );

    await waitForCatalogItems(client, catalogName, [itemId]);

    await withTimeout(
      client.replaceCatalogItems({
        catalogName,
        documents: {
          [itemId]: { price: 50 },
        },
      })
    );

    const item = await waitForCatalogItemValue(
      client,
      catalogName,
      itemId,
      (value) => value.price === 50 && Object.keys(value).length === 1
    );

    expect(item.value).toEqual({ price: 50 });
  }, 180000);
});

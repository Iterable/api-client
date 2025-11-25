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
  createIterableError,
  isIterableApiError,
  IterableApiError,
} from "../../src/errors.js";
import { UpdateCatalogItemParamsSchema } from "../../src/types/catalogs.js";
import { createMockClient } from "../utils/test-helpers";

describe("Catalog Operations", () => {
  let client: IterableClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ client, mockAxiosInstance } = createMockClient());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createCatalog", () => {
    it("should create catalog with correct endpoint", async () => {
      const mockResponse = {
        data: {
          msg: "Catalog created successfully",
          code: "Success",
        },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.createCatalog("test-catalog");

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/catalogs/test-catalog"
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should encode catalog name with special characters", async () => {
      const mockResponse = {
        data: {
          msg: "Catalog created successfully",
          code: "Success",
        },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.createCatalog("test catalog/with+special");

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/catalogs/test%20catalog%2Fwith%2Bspecial"
      );
    });
  });

  describe("updateCatalogItems", () => {
    it("should encode catalog name with special characters", async () => {
      const mockResponse = {
        data: {
          msg: "Items updated",
          code: "Success",
        },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.updateCatalogItems({
        catalogName: "my catalog",
        items: [{ id: "item1", name: "Test" }],
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "/api/catalogs/my%20catalog/items",
        expect.any(Object)
      );
    });
  });

  describe("getCatalogItem", () => {
    it("should get item with correct endpoint", async () => {
      const mockResponse = {
        data: {
          catalogName: "products",
          itemId: "item1",
          lastModified: 1704067200000,
          size: 1024,
          value: { name: "Product 1" },
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getCatalogItem("products", "item1");

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/catalogs/products/items/item1"
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should encode catalog name and item ID with special characters", async () => {
      const mockResponse = {
        data: {
          catalogName: "my catalog",
          itemId: "item/1",
          lastModified: 1704067200000,
          size: 1024,
          value: {},
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getCatalogItem("my catalog", "item/1");

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/catalogs/my%20catalog/items/item%2F1"
      );
    });
  });

  describe("deleteCatalogItem", () => {
    it("should delete item with correct endpoint", async () => {
      const mockResponse = {
        data: {
          msg: "Item deleted",
          code: "Success",
        },
      };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await client.deleteCatalogItem("products", "item1");

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/api/catalogs/products/items/item1"
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should encode catalog name and item ID with special characters", async () => {
      const mockResponse = {
        data: {
          msg: "Item deleted",
          code: "Success",
        },
      };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      await client.deleteCatalogItem("my catalog", "item+1");

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/api/catalogs/my%20catalog/items/item%2B1"
      );
    });
  });

  describe("getCatalogs", () => {
    it("should build pagination query parameters", async () => {
      const mockResponse = {
        data: {
          catalogNames: [],
          totalCatalogsCount: 5,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getCatalogs({ page: 2, pageSize: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/catalogs?page=2&pageSize=10"
      );
    });

    it("should handle no parameters", async () => {
      const mockResponse = {
        data: {
          catalogNames: [{ name: "catalog1" }, { name: "catalog2" }],
          totalCatalogsCount: 2,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getCatalogs();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/api/catalogs");
    });

    it("should handle only page parameter", async () => {
      const mockResponse = {
        data: {
          catalogNames: [],
          totalCatalogsCount: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getCatalogs({ page: 3 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/catalogs?page=3"
      );
    });

    it("should handle only pageSize parameter", async () => {
      const mockResponse = {
        data: {
          catalogNames: [],
          totalCatalogsCount: 0,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      await client.getCatalogs({ pageSize: 50 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        "/api/catalogs?pageSize=50"
      );
    });

    it("should return proper response structure", async () => {
      const mockResponse = {
        data: {
          catalogNames: [{ name: "products" }, { name: "categories" }],
          totalCatalogsCount: 25,
          nextPageUrl: "/api/catalogs?page=2",
          previousPageUrl: "/api/catalogs?page=1",
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getCatalogs({ page: 2 });

      expect(result).toHaveProperty("catalogNames");
      expect(result).toHaveProperty("totalCatalogsCount");
      expect(result).toHaveProperty("nextPageUrl");
      expect(result).toHaveProperty("previousPageUrl");
      expect(Array.isArray(result.catalogNames)).toBe(true);
      expect(result.catalogNames).toHaveLength(2);
      expect(result.totalCatalogsCount).toBe(25);
    });
  });

  describe("Catalog Items Operations", () => {
    describe("getCatalogItems", () => {
      it("should get catalog items with minimal parameters", async () => {
        const mockResponse = {
          data: {
            msg: "",
            code: "Success",
            params: {
              catalogItemsWithProperties: [
                {
                  catalogName: "products",
                  itemId: "item1",
                  lastModified: 1704067200000,
                  size: 1024,
                  value: { name: "Product 1", price: 19.99 },
                },
                {
                  catalogName: "products",
                  itemId: "item2",
                  lastModified: 1704153600000,
                  size: 2048,
                  value: { name: "Product 2", price: 29.99 },
                },
              ],
              totalItemsCount: 150,
              nextPageUrl: "/api/catalogs/products/items?page=2",
            },
          },
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.getCatalogItems({
          catalogName: "products",
        });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/api/catalogs/products/items"
        );
        expect(result).toEqual(mockResponse.data.params);
        expect(result.catalogItemsWithProperties).toHaveLength(2);
        expect(result.totalItemsCount).toBe(150);
      });

      it("should get catalog items with all parameters", async () => {
        const mockResponse = {
          data: {
            msg: "",
            code: "Success",
            params: {
              catalogItemsWithProperties: [
                {
                  catalogName: "products",
                  itemId: "item3",
                  lastModified: 1704240000000,
                  size: 512,
                  value: {
                    name: "Product 3",
                    price: 9.99,
                    category: "electronics",
                  },
                },
              ],
              totalItemsCount: 1,
              previousPageUrl: "/api/catalogs/products/items?page=1",
            },
          },
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        const result = await client.getCatalogItems({
          catalogName: "products",
          page: 2,
          pageSize: 50,
          orderBy: "price",
          sortAscending: true,
        });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/api/catalogs/products/items?page=2&pageSize=50&orderBy=price&sortAscending=true"
        );
        expect(result.catalogItemsWithProperties).toHaveLength(1);
        expect(result.totalItemsCount).toBe(1);
        expect(result.previousPageUrl).toBe(
          "/api/catalogs/products/items?page=1"
        );
      });

      it("should handle catalog name with special characters", async () => {
        const mockResponse = {
          data: {
            msg: "",
            code: "Success",
            params: {
              catalogItemsWithProperties: [],
              totalItemsCount: 0,
            },
          },
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        await client.getCatalogItems({
          catalogName: "test-catalog with spaces",
        });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/api/catalogs/test-catalog%20with%20spaces/items"
        );
      });

      it("should handle boolean parameters correctly", async () => {
        const mockResponse = {
          data: {
            msg: "",
            code: "Success",
            params: {
              catalogItemsWithProperties: [],
              totalItemsCount: 0,
            },
          },
        };
        mockAxiosInstance.get.mockResolvedValue(mockResponse);

        await client.getCatalogItems({
          catalogName: "products",
          sortAscending: false,
        });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith(
          "/api/catalogs/products/items?sortAscending=false"
        );
      });
    });
  });

  describe("Schema Validation", () => {
    it("should validate catalog parameters", () => {
      // Valid catalog update
      expect(() =>
        UpdateCatalogItemParamsSchema.parse({
          catalogName: "products",
          items: [
            {
              id: "item1",
              name: "Test Product",
              price: 29.99,
              description: "A test product",
              categories: ["electronics"],
            },
          ],
        })
      ).not.toThrow();

      // Invalid - missing required item fields
      expect(() =>
        UpdateCatalogItemParamsSchema.parse({
          catalogName: "products",
          items: [{ price: 29.99 }], // missing id and name
        })
      ).toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors properly", async () => {
      const axiosError = {
        response: {
          status: 404,
          data: {
            code: "NotFound",
            msg: "Catalog not found",
            params: { catalogName: "nonexistent" },
          },
        },
        config: { url: "/api/catalogs/nonexistent" },
      };

      const expectedError = createIterableError(axiosError);
      mockAxiosInstance.get.mockRejectedValue(expectedError);

      const promise = client.getCatalogItem("nonexistent", "item123");
      await expect(promise).rejects.toThrow(IterableApiError);

      try {
        await promise;
      } catch (error) {
        expect(isIterableApiError(error)).toBe(true);
        if (isIterableApiError(error)) {
          expect(error.isNotFoundError()).toBe(true);
          expect(error.code).toBe("NotFound");
        }
      }
    });
  });

  describe("deleteCatalog", () => {
    it("should delete catalog with correct endpoint", async () => {
      const mockResponse = {
        data: {
          msg: "Catalog deleted successfully",
          code: "Success",
        },
      };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await client.deleteCatalog("test-catalog");

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/api/catalogs/test-catalog"
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should encode catalog name with special characters", async () => {
      const mockResponse = {
        data: {
          msg: "Catalog deleted successfully",
          code: "Success",
        },
      };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      await client.deleteCatalog("test catalog with spaces");

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/api/catalogs/test%20catalog%20with%20spaces"
      );
    });
  });

  describe("updateCatalogFieldMappings", () => {
    it("should update field mappings with correct structure", async () => {
      const mockResponse = {
        data: {
          msg: "Field mappings updated",
          code: "Success",
        },
      };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const mappingsUpdates = [
        { fieldName: "price", fieldType: "double" },
        { fieldName: "inStock", fieldType: "boolean" },
      ];

      const result = await client.updateCatalogFieldMappings({
        catalogName: "products",
        mappingsUpdates,
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/api/catalogs/products/fieldMappings",
        {
          mappingsUpdates,
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should handle nested field definitions", async () => {
      const mockResponse = {
        data: {
          msg: "Field mappings updated",
          code: "Success",
        },
      };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const mappingsUpdates = [
        {
          fieldName: "metadata",
          fieldType: "object",
          children: [
            { fieldName: "tags", fieldType: "string" },
            { fieldName: "score", fieldType: "long" },
          ],
        },
      ];

      await client.updateCatalogFieldMappings({
        catalogName: "products",
        mappingsUpdates,
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/api/catalogs/products/fieldMappings",
        {
          mappingsUpdates,
        }
      );
    });
  });

  describe("bulkDeleteCatalogItems", () => {
    it("should bulk delete items with correct body", async () => {
      const mockResponse = {
        data: {
          msg: "Bulk delete request received",
          code: "Success",
        },
      };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const itemIds = ["item1", "item2", "item3"];

      const result = await client.bulkDeleteCatalogItems({
        catalogName: "products",
        itemIds,
      });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/api/catalogs/products/items",
        {
          data: {
            itemIds,
          },
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should handle empty item array", async () => {
      const mockResponse = {
        data: {
          msg: "Bulk delete request received",
          code: "Success",
        },
      };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      await client.bulkDeleteCatalogItems({
        catalogName: "products",
        itemIds: [],
      });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        "/api/catalogs/products/items",
        {
          data: {
            itemIds: [],
          },
        }
      );
    });
  });

  describe("partialUpdateCatalogItem", () => {
    it("should patch update item with correct body", async () => {
      const mockResponse = {
        data: {
          msg: "Catalog item update request received",
          code: "Success",
        },
      };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const update = {
        price: 29.99,
        inStock: true,
      };

      const result = await client.partialUpdateCatalogItem({
        catalogName: "products",
        itemId: "item123",
        update,
      });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/api/catalogs/products/items/item123",
        {
          update,
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should encode catalog name and item ID", async () => {
      const mockResponse = {
        data: {
          msg: "Catalog item update request received",
          code: "Success",
        },
      };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      await client.partialUpdateCatalogItem({
        catalogName: "test catalog",
        itemId: "item with spaces",
        update: { name: "Updated" },
      });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/api/catalogs/test%20catalog/items/item%20with%20spaces",
        {
          update: { name: "Updated" },
        }
      );
    });
  });

  describe("replaceCatalogItem", () => {
    it("should put replace item with correct body", async () => {
      const mockResponse = {
        data: {
          msg: "Catalog item update request received",
          code: "Success",
        },
      };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const value = {
        name: "New Product",
        price: 49.99,
        category: "electronics",
      };

      const result = await client.replaceCatalogItem({
        catalogName: "products",
        itemId: "item123",
        value,
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/api/catalogs/products/items/item123",
        {
          value,
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should handle complex value objects", async () => {
      const mockResponse = {
        data: {
          msg: "Catalog item update request received",
          code: "Success",
        },
      };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const value = {
        name: "Complex Product",
        metadata: {
          tags: ["featured", "sale"],
          ratings: { average: 4.5, count: 120 },
        },
        variants: [
          { id: "v1", size: "small" },
          { id: "v2", size: "large" },
        ],
      };

      await client.replaceCatalogItem({
        catalogName: "products",
        itemId: "complex-item",
        value,
      });

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/api/catalogs/products/items/complex-item",
        {
          value,
        }
      );
    });
  });

  describe("getCatalogFieldMappings - updated response structure", () => {
    it("should return definedMappings object and undefinedFields array", async () => {
      const mockResponse = {
        data: {
          msg: "",
          code: "Success",
          params: {
            definedMappings: {
              price: "double",
              name: "string",
              inStock: "boolean",
            },
            undefinedFields: ["customField1", "customField2"],
          },
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getCatalogFieldMappings({
        catalogName: "products",
      });

      expect(result).toHaveProperty("definedMappings");
      expect(result).toHaveProperty("undefinedFields");
      expect(typeof result.definedMappings).toBe("object");
      expect(Array.isArray(result.undefinedFields)).toBe(true);
      expect(result.definedMappings).toEqual({
        price: "double",
        name: "string",
        inStock: "boolean",
      });
      expect(result.undefinedFields).toEqual(["customField1", "customField2"]);
    });
  });
});

import {
  BulkDeleteCatalogItemsParams,
  CatalogFieldMappingsResponse,
  CatalogFieldMappingsResponseSchema,
  CatalogItemWithProperties,
  CatalogItemWithPropertiesSchema,
  GetCatalogFieldMappingsParams,
  GetCatalogItemsParams,
  GetCatalogItemsResponse,
  GetCatalogItemsResponseSchema,
  GetCatalogsParams,
  GetCatalogsResponse,
  GetCatalogsResponseSchema,
  PartialUpdateCatalogItemParams,
  ReplaceCatalogItemParams,
  UpdateCatalogFieldMappingsParams,
  UpdateCatalogItemParams,
} from "../types/catalogs.js";
import {
  IterableSuccessResponse,
  IterableSuccessResponseSchema,
} from "../types/common.js";
import type { Constructor } from "./base.js";
import type { BaseIterableClient } from "./base.js";

/**
 * Catalogs operations mixin
 */
export function Catalogs<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    async createCatalog(catalogName: string): Promise<IterableSuccessResponse> {
      const response = await this.client.post(
        `/api/catalogs/${encodeURIComponent(catalogName)}`
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async updateCatalogItems(
      options: UpdateCatalogItemParams
    ): Promise<IterableSuccessResponse> {
      // Convert items array to documents object (map of id to values)
      const documents: Record<string, any> = {};
      options.items.forEach((item) => {
        documents[item.id] = {
          name: item.name,
          description: item.description,
          price: item.price,
          categories: item.categories,
          imageUrl: item.imageUrl,
          url: item.url,
          ...item.dataFields,
        };
      });

      const response = await this.client.post(
        `/api/catalogs/${encodeURIComponent(options.catalogName)}/items`,
        {
          documents,
          replaceUploadedFieldsOnly: false,
        }
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    async getCatalogItem(
      catalogName: string,
      itemId: string
    ): Promise<CatalogItemWithProperties> {
      const response = await this.client.get(
        `/api/catalogs/${encodeURIComponent(catalogName)}/items/${encodeURIComponent(itemId)}`
      );
      return this.validateResponse(response, CatalogItemWithPropertiesSchema);
    }

    async deleteCatalogItem(
      catalogName: string,
      itemId: string
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.delete(
        `/api/catalogs/${encodeURIComponent(catalogName)}/items/${encodeURIComponent(itemId)}`
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Get list of all catalogs with optional pagination
     */
    async getCatalogs(
      params?: GetCatalogsParams
    ): Promise<GetCatalogsResponse> {
      const queryParams = new URLSearchParams();

      if (params?.page) {
        queryParams.append("page", params.page.toString());
      }
      if (params?.pageSize) {
        queryParams.append("pageSize", params.pageSize.toString());
      }

      const url = `/api/catalogs${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await this.client.get(url);
      // Check if the API wraps the response in params like other catalog endpoints
      if (response.data && response.data.params) {
        return this.validateResponse(
          { data: response.data.params },
          GetCatalogsResponseSchema
        );
      }
      return this.validateResponse(response, GetCatalogsResponseSchema);
    }

    /**
     * Get field mappings for a catalog
     */
    async getCatalogFieldMappings(
      params: GetCatalogFieldMappingsParams
    ): Promise<CatalogFieldMappingsResponse> {
      const response = await this.client.get(
        `/api/catalogs/${encodeURIComponent(params.catalogName)}/fieldMappings`
      );
      // The API returns { msg, code, params: { definedMappings, undefinedFields } }
      // Extract params and validate that directly
      if (response.data && response.data.params) {
        return this.validateResponse(
          { data: response.data.params },
          CatalogFieldMappingsResponseSchema
        );
      }
      return this.validateResponse(response, CatalogFieldMappingsResponseSchema);
    }

    /**
     * Get catalog items with optional pagination and sorting
     */
    async getCatalogItems(
      params: GetCatalogItemsParams
    ): Promise<GetCatalogItemsResponse> {
      const queryParams = new URLSearchParams();

      if (params.page) {
        queryParams.append("page", params.page.toString());
      }
      if (params.pageSize) {
        queryParams.append("pageSize", params.pageSize.toString());
      }
      if (params.orderBy) {
        queryParams.append("orderBy", params.orderBy);
      }
      if (params.sortAscending !== undefined) {
        queryParams.append("sortAscending", params.sortAscending.toString());
      }

      const url = `/api/catalogs/${encodeURIComponent(params.catalogName)}/items${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;
      const response = await this.client.get(url);
      // The API returns { msg, code, params: { catalogItemsWithProperties, totalItemsCount } }
      // Extract params and validate that directly
      if (response.data && response.data.params) {
        return this.validateResponse(
          { data: response.data.params },
          GetCatalogItemsResponseSchema
        );
      }
      return this.validateResponse(response, GetCatalogItemsResponseSchema);
    }

    /**
     * Delete a catalog
     */
    async deleteCatalog(catalogName: string): Promise<IterableSuccessResponse> {
      const response = await this.client.delete(
        `/api/catalogs/${encodeURIComponent(catalogName)}`
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Update catalog field mappings (data types)
     */
    async updateCatalogFieldMappings(
      params: UpdateCatalogFieldMappingsParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.put(
        `/api/catalogs/${encodeURIComponent(params.catalogName)}/fieldMappings`,
        {
          mappingsUpdates: params.mappingsUpdates,
        }
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Bulk delete catalog items
     */
    async bulkDeleteCatalogItems(
      params: BulkDeleteCatalogItemsParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.delete(
        `/api/catalogs/${encodeURIComponent(params.catalogName)}/items`,
        {
          data: {
            itemIds: params.itemIds,
          },
        }
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Partial update (PATCH) a catalog item - updates only specified fields
     */
    async partialUpdateCatalogItem(
      params: PartialUpdateCatalogItemParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.patch(
        `/api/catalogs/${encodeURIComponent(params.catalogName)}/items/${encodeURIComponent(params.itemId)}`,
        {
          update: params.update,
        }
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Replace (PUT) a catalog item - replaces the entire item
     */
    async replaceCatalogItem(
      params: ReplaceCatalogItemParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.put(
        `/api/catalogs/${encodeURIComponent(params.catalogName)}/items/${encodeURIComponent(params.itemId)}`,
        {
          value: params.value,
        }
      );
      return this.validateResponse(response, IterableSuccessResponseSchema);
    }
  };
}

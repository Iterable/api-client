import type { AxiosInstance } from "axios";

import type { CatalogDocuments } from "../types/catalogs.js";
import {
  BulkDeleteCatalogItemsParams,
  CatalogFieldMappingsResponse,
  CatalogFieldMappingsResponseSchema,
  CatalogItemWithProperties,
  CatalogItemWithPropertiesSchema,
  CreateCatalogParams,
  DeleteCatalogItemParams,
  DeleteCatalogParams,
  GetCatalogFieldMappingsParams,
  GetCatalogItemParams,
  GetCatalogItemsParams,
  GetCatalogItemsResponse,
  GetCatalogItemsResponseSchema,
  GetCatalogsParams,
  GetCatalogsResponse,
  GetCatalogsResponseSchema,
  PartialUpdateCatalogItemParams,
  PartialUpdateCatalogItemsParams,
  ReplaceCatalogItemParams,
  ReplaceCatalogItemsParams,
  UpdateCatalogFieldMappingsParams,
} from "../types/catalogs.js";
import {
  IterableSuccessResponse,
  IterableSuccessResponseSchema,
} from "../types/common.js";
import type { Constructor } from "./base.js";
import type { BaseIterableClient } from "./base.js";
import { validateResponse } from "./base.js";

async function bulkUploadCatalogItems(
  client: AxiosInstance,
  catalogName: string,
  documents: CatalogDocuments,
  replaceUploadedFieldsOnly: boolean
): Promise<IterableSuccessResponse> {
  const response = await client.post(
    `/api/catalogs/${encodeURIComponent(catalogName)}/items`,
    { documents, replaceUploadedFieldsOnly }
  );
  return validateResponse(response, IterableSuccessResponseSchema);
}

/**
 * Catalogs operations mixin
 */
export function Catalogs<T extends Constructor<BaseIterableClient>>(Base: T) {
  return class extends Base {
    async createCatalog(
      params: CreateCatalogParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.post(
        `/api/catalogs/${encodeURIComponent(params.catalogName)}`
      );
      return validateResponse(response, IterableSuccessResponseSchema);
    }

    /**
     * Bulk partial update catalog items
     */
    async partialUpdateCatalogItems(
      params: PartialUpdateCatalogItemsParams
    ): Promise<IterableSuccessResponse> {
      return bulkUploadCatalogItems(
        this.client,
        params.catalogName,
        params.documents,
        true
      );
    }

    /**
     * Bulk replace catalog items
     */
    async replaceCatalogItems(
      params: ReplaceCatalogItemsParams
    ): Promise<IterableSuccessResponse> {
      return bulkUploadCatalogItems(
        this.client,
        params.catalogName,
        params.documents,
        false
      );
    }

    async getCatalogItem(
      params: GetCatalogItemParams
    ): Promise<CatalogItemWithProperties> {
      const response = await this.client.get(
        `/api/catalogs/${encodeURIComponent(params.catalogName)}/items/${encodeURIComponent(params.itemId)}`
      );
      return validateResponse(response, CatalogItemWithPropertiesSchema);
    }

    async deleteCatalogItem(
      params: DeleteCatalogItemParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.delete(
        `/api/catalogs/${encodeURIComponent(params.catalogName)}/items/${encodeURIComponent(params.itemId)}`
      );
      return validateResponse(response, IterableSuccessResponseSchema);
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
        return validateResponse(
          { data: response.data.params },
          GetCatalogsResponseSchema
        );
      }
      return validateResponse(response, GetCatalogsResponseSchema);
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
        return validateResponse(
          { data: response.data.params },
          CatalogFieldMappingsResponseSchema
        );
      }
      return validateResponse(response, CatalogFieldMappingsResponseSchema);
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
        return validateResponse(
          { data: response.data.params },
          GetCatalogItemsResponseSchema
        );
      }
      return validateResponse(response, GetCatalogItemsResponseSchema);
    }

    /**
     * Delete a catalog
     */
    async deleteCatalog(
      params: DeleteCatalogParams
    ): Promise<IterableSuccessResponse> {
      const response = await this.client.delete(
        `/api/catalogs/${encodeURIComponent(params.catalogName)}`
      );
      return validateResponse(response, IterableSuccessResponseSchema);
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
      return validateResponse(response, IterableSuccessResponseSchema);
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
      return validateResponse(response, IterableSuccessResponseSchema);
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
      return validateResponse(response, IterableSuccessResponseSchema);
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
      return validateResponse(response, IterableSuccessResponseSchema);
    }
  };
}

import { z } from "zod";

import { UnixTimestampSchema } from "./common.js";

/**
 * Catalog management schemas and types
 */

export const CatalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().optional(),
  categories: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  url: z.string().optional(),
  dataFields: z.record(z.string(), z.any()).optional(),
});

export type CatalogItem = z.infer<typeof CatalogItemSchema>;
export type UpdateCatalogItemParams = z.infer<
  typeof UpdateCatalogItemParamsSchema
>;
export type GetCatalogItemParams = z.infer<typeof GetCatalogItemParamsSchema>;
export type DeleteCatalogItemParams = z.infer<
  typeof DeleteCatalogItemParamsSchema
>;

export const UpdateCatalogItemParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  items: z.array(CatalogItemSchema).describe("Catalog items to update"),
});

export const GetCatalogItemParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  itemId: z.string().describe("ID of the catalog item to retrieve"),
});

export const DeleteCatalogItemParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  itemId: z.string().describe("ID of the catalog item to delete"),
});

export const CatalogNameSchema = z.object({
  name: z.string(),
});

export const CatalogSchema = z.object({
  catalogName: z.string(),
  itemCount: z.number().optional(),
});

export const GetCatalogsResponseSchema = z.object({
  catalogNames: z.array(CatalogNameSchema),
  totalCatalogsCount: z.number(),
  nextPageUrl: z.string().optional(),
  previousPageUrl: z.string().optional(),
});

export const GetCatalogsParamsSchema = z
  .object({
    page: z.number().min(1).optional().describe("Page number (starting at 1)"),
    pageSize: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe("Number of results per page (max 100)"),
  })
  .describe("Parameters for listing catalogs with optional pagination");

export const CatalogFieldMappingSchema = z.object({
  fieldName: z.string(),
  fieldType: z.string(),
});

export const CatalogFieldMappingsResponseSchema = z.object({
  definedMappings: z.record(z.string(), z.string()),
  undefinedFields: z.array(z.string()),
});

export const GetCatalogFieldMappingsParamsSchema = z
  .object({
    catalogName: z.string().describe("Name of the catalog"),
  })
  .describe("Parameters for getting catalog field mappings");

export const CreateCatalogParamsSchema = z
  .object({
    catalogName: z
      .string()
      .max(255)
      .regex(/^[a-zA-Z0-9-]+$/)
      .describe("Catalog name (alphanumeric and dashes only, max 255 chars)"),
  })
  .describe("Parameters for creating a catalog");

// Type exports
export type CatalogName = z.infer<typeof CatalogNameSchema>;
export type Catalog = z.infer<typeof CatalogSchema>;
export type GetCatalogsResponse = z.infer<typeof GetCatalogsResponseSchema>;
export type GetCatalogsParams = z.infer<typeof GetCatalogsParamsSchema>;
export type CatalogFieldMapping = z.infer<typeof CatalogFieldMappingSchema>;
export type CatalogFieldMappingsResponse = z.infer<
  typeof CatalogFieldMappingsResponseSchema
>;
export type GetCatalogFieldMappingsParams = z.infer<
  typeof GetCatalogFieldMappingsParamsSchema
>;
export type CreateCatalogParams = z.infer<typeof CreateCatalogParamsSchema>;

// Catalog items schemas
export const CatalogItemWithPropertiesSchema = z.object({
  catalogName: z.string(),
  itemId: z.string(),
  lastModified: UnixTimestampSchema,
  size: z.number(),
  value: z.record(z.string(), z.any()), // JsObject - flexible object
});

// This is what the client returns (the params object directly)
export const GetCatalogItemsResponseSchema = z.object({
  catalogItemsWithProperties: z.array(CatalogItemWithPropertiesSchema),
  totalItemsCount: z.number(),
  nextPageUrl: z.string().optional(),
  previousPageUrl: z.string().optional(),
});

export const GetCatalogItemsParamsSchema = z
  .object({
    catalogName: z.string().describe("Name of the catalog"),
    page: z.number().min(1).optional().describe("Page number (starting at 1)"),
    pageSize: z
      .number()
      .min(1)
      .max(1000)
      .optional()
      .describe("Number of results per page (defaults to 10, max 1000)"),
    orderBy: z
      .string()
      .optional()
      .describe("Field by which results should be ordered"),
    sortAscending: z
      .boolean()
      .optional()
      .describe("Sort results by ascending (defaults to false)"),
  })
  .describe("Parameters for getting catalog items");

export type CatalogItemWithProperties = z.infer<
  typeof CatalogItemWithPropertiesSchema
>;
export type GetCatalogItemsResponse = z.infer<
  typeof GetCatalogItemsResponseSchema
>;
export type GetCatalogItemsParams = z.infer<typeof GetCatalogItemsParamsSchema>;

// Catalog field definition for field mappings update
export const CatalogFieldDefinitionSchema: z.ZodType<CatalogFieldDefinition> =
  z.lazy(() =>
    z.object({
      fieldName: z.string(),
      fieldType: z.string(),
      children: z.array(CatalogFieldDefinitionSchema).optional(),
    })
  );

export type CatalogFieldDefinition = {
  fieldName: string;
  fieldType: string;
  children?: CatalogFieldDefinition[];
};

// Update catalog field mappings
export const UpdateCatalogFieldMappingsParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  mappingsUpdates: z
    .array(CatalogFieldDefinitionSchema)
    .describe("Field mappings to update"),
});

export type UpdateCatalogFieldMappingsParams = z.infer<
  typeof UpdateCatalogFieldMappingsParamsSchema
>;

// Bulk delete catalog items
export const BulkDeleteCatalogItemsParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  itemIds: z.array(z.string()).describe("Array of item IDs to delete"),
});

export type BulkDeleteCatalogItemsParams = z.infer<
  typeof BulkDeleteCatalogItemsParamsSchema
>;

// Partial update catalog item (PATCH)
export const PartialUpdateCatalogItemParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  itemId: z.string().describe("ID of the catalog item"),
  update: z.record(z.string(), z.any()).describe("Fields to update"),
});

export type PartialUpdateCatalogItemParams = z.infer<
  typeof PartialUpdateCatalogItemParamsSchema
>;

// Replace catalog item (PUT)
export const ReplaceCatalogItemParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  itemId: z.string().describe("ID of the catalog item"),
  value: z.record(z.string(), z.any()).describe("New value for the item"),
});

export type ReplaceCatalogItemParams = z.infer<
  typeof ReplaceCatalogItemParamsSchema
>;

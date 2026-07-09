import { z } from "zod";

import { UnixTimestampSchema } from "./common.js";

const CATALOG_ITEM_ID_REGEX = /^[a-zA-Z0-9-]{1,255}$/;
const MAX_CATALOG_BULK_DOCUMENTS = 1000;

export const CatalogItemIdSchema = z
  .string()
  .regex(
    CATALOG_ITEM_ID_REGEX,
    "Invalid catalog item ID (alphanumeric and dashes only, max 255 chars)"
  );

function validateCatalogItemFieldNames(
  fields: Record<string, unknown>,
  ctx: z.RefinementCtx
): void {
  for (const fieldName of Object.keys(fields)) {
    if (fieldName.includes(".")) {
      ctx.addIssue({
        code: "custom",
        message: `Field name "${fieldName}" must not contain periods`,
      });
    }
  }
}

export const CatalogDocumentFieldsSchema = z
  .record(z.string(), z.unknown())
  .superRefine(validateCatalogItemFieldNames)
  .describe("Catalog item field values");

export type CatalogDocumentFields = z.infer<typeof CatalogDocumentFieldsSchema>;

function validateCatalogDocuments(
  documents: Record<string, CatalogDocumentFields>,
  ctx: z.RefinementCtx
): void {
  const itemIds = Object.keys(documents);

  if (itemIds.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "documents must contain at least one catalog item",
    });
    return;
  }

  if (itemIds.length > MAX_CATALOG_BULK_DOCUMENTS) {
    ctx.addIssue({
      code: "custom",
      message: `documents may contain at most ${MAX_CATALOG_BULK_DOCUMENTS} items`,
    });
  }

  for (const itemId of itemIds) {
    if (!CATALOG_ITEM_ID_REGEX.test(itemId)) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid catalog item ID "${itemId}" (alphanumeric and dashes only, max 255 chars)`,
      });
    }
  }
}

export const GetCatalogItemParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  itemId: CatalogItemIdSchema.describe("ID of the catalog item to retrieve"),
});

export type GetCatalogItemParams = z.infer<typeof GetCatalogItemParamsSchema>;

export const DeleteCatalogItemParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  itemId: CatalogItemIdSchema.describe("ID of the catalog item to delete"),
});

export type DeleteCatalogItemParams = z.infer<
  typeof DeleteCatalogItemParamsSchema
>;

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

export const DeleteCatalogParamsSchema = z.object({
  catalogName: z
    .string()
    .max(255)
    .regex(/^[a-zA-Z0-9-]+$/)
    .describe("Name of the catalog to delete"),
});

export type DeleteCatalogParams = z.infer<typeof DeleteCatalogParamsSchema>;

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

export const CatalogDocumentsSchema = z
  .record(z.string(), CatalogDocumentFieldsSchema)
  .superRefine(validateCatalogDocuments)
  .describe("Map of catalog item ID to field values");

export type CatalogDocuments = z.infer<typeof CatalogDocumentsSchema>;

const BulkCatalogItemsParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  documents: CatalogDocumentsSchema,
});

// Bulk partial update catalog items
export const PartialUpdateCatalogItemsParamsSchema =
  BulkCatalogItemsParamsSchema;

export type PartialUpdateCatalogItemsParams = z.infer<
  typeof PartialUpdateCatalogItemsParamsSchema
>;

// Bulk replace catalog items
export const ReplaceCatalogItemsParamsSchema = BulkCatalogItemsParamsSchema;

export type ReplaceCatalogItemsParams = z.infer<
  typeof ReplaceCatalogItemsParamsSchema
>;

// Bulk delete catalog items
export const BulkDeleteCatalogItemsParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  itemIds: z
    .array(CatalogItemIdSchema)
    .describe("Array of item IDs to delete"),
});

export type BulkDeleteCatalogItemsParams = z.infer<
  typeof BulkDeleteCatalogItemsParamsSchema
>;

// Partial update catalog item (PATCH)
export const PartialUpdateCatalogItemParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  itemId: CatalogItemIdSchema.describe("ID of the catalog item"),
  update: CatalogDocumentFieldsSchema.describe("Fields to update"),
});

export type PartialUpdateCatalogItemParams = z.infer<
  typeof PartialUpdateCatalogItemParamsSchema
>;

// Replace catalog item (PUT)
export const ReplaceCatalogItemParamsSchema = z.object({
  catalogName: z.string().describe("Name of the catalog"),
  itemId: CatalogItemIdSchema.describe("ID of the catalog item"),
  value: CatalogDocumentFieldsSchema.describe("New value for the item"),
});

export type ReplaceCatalogItemParams = z.infer<
  typeof ReplaceCatalogItemParamsSchema
>;

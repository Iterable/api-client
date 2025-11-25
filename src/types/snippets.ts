import { z } from "zod";

import { ISODateTimeSchema } from "./common.js";

/**
 * Snippets management schemas and types
 */

// Core snippet response schema
export const SnippetResponseSchema = z.object({
  content: z.string().describe("Snippet content"),
  createdAt: ISODateTimeSchema.describe(
    "Creation timestamp in ISO-8601 format."
  ),
  createdBy: z.string().describe("User who created the snippet"),
  description: z.string().optional().describe("Snippet description"),
  id: z.number().describe("Snippet ID"),
  name: z.string().describe("Snippet name"),
  projectId: z.number().describe("Project ID"),
  updatedAt: ISODateTimeSchema.describe(
    "Last update timestamp in ISO-8601 format."
  ),
  updatedBy: z.string().describe("User who last updated the snippet"),
  variables: z
    .array(z.string())
    .describe(
      "List of variable names used in the content with a Handlebars expression such as {{myField}}"
    ),
});

export type SnippetResponse = z.infer<typeof SnippetResponseSchema>;

// Parameter schemas for creating snippets
export const CreateSnippetParamsSchema = z.object({
  content: z
    .string()
    .describe(
      'Content of the snippet. Handlebars must be valid. Disallowed content: script tags with JS sources or non-JSON content, inline JS event handlers (e.g., onload="..."), and javascript: in href or src attributes (anchors and iframes).'
    ),
  name: z
    .string()
    .describe(
      "Name of the snippet. Must be unique within the project, up to 100 characters (a-z, A-Z, 0-9, hyphens (-), underscores (_), and spaces). Cannot be changed after snippet is created."
    ),
  description: z.string().optional().describe("Description of the snippet"),
  createdByUserId: z
    .string()
    .optional()
    .describe(
      "User ID (email) of the creator. If not provided, defaults to the project creator."
    ),
  variables: z
    .array(z.string())
    .optional()
    .describe(
      'A list of variable names used in the content with a Handlebars expression such as {{#if (eq myVariable "someValue")}}. Variable names are case-sensitive and should be simple identifiers (letters, numbers, underscores). To learn more about using variables in Snippets, see Customizing Snippets with Variables.'
    ),
});

export type CreateSnippetParams = z.infer<typeof CreateSnippetParamsSchema>;

// Response schemas
export const GetSnippetsResponseSchema = z.object({
  snippets: z.array(SnippetResponseSchema).describe("List of snippets"),
});

export type GetSnippetsResponse = z.infer<typeof GetSnippetsResponseSchema>;

export const CreateSnippetResponseSchema = z.object({
  snippetId: z.number().describe("ID of the created snippet"),
});

export type CreateSnippetResponse = z.infer<typeof CreateSnippetResponseSchema>;

export const GetSnippetResponseSchema = z.object({
  snippet: SnippetResponseSchema.describe("Details of the retrieved snippet"),
});

export type GetSnippetResponse = z.infer<typeof GetSnippetResponseSchema>;

export const UpdateSnippetResponseSchema = z.object({
  snippetId: z.number().describe("ID of the updated snippet"),
});

export type UpdateSnippetResponse = z.infer<typeof UpdateSnippetResponseSchema>;

export const DeleteSnippetResponseSchema = z.object({
  snippetId: z.number().describe("ID of the deleted snippet"),
});

export type DeleteSnippetResponse = z.infer<typeof DeleteSnippetResponseSchema>;

// Identifier schema for get/update/delete operations
export const SnippetIdentifierSchema = z
  .union([
    z.string().describe("Snippet name"),
    z.number().describe("Snippet ID"),
  ])
  .describe(
    "Snippet ID (numeric) or name (string). Numeric identifiers are treated as IDs, string identifiers as names"
  );

export type SnippetIdentifier = z.infer<typeof SnippetIdentifierSchema>;

export const GetSnippetParamsSchema = z.object({
  identifier: SnippetIdentifierSchema,
});

export type GetSnippetParams = z.infer<typeof GetSnippetParamsSchema>;

export const UpdateSnippetParamsSchema = z.object({
  identifier: SnippetIdentifierSchema,
  content: z
    .string()
    .describe(
      'Content of the snippet. Handlebars must be valid. Disallowed content: script tags with JS sources or non-JSON content, inline JS event handlers (e.g., onload="..."), and javascript: in href or src attributes (anchors and iframes).'
    ),
  description: z.string().optional().describe("Description of the snippet"),
  createdByUserId: z
    .string()
    .optional()
    .describe(
      "User ID (email) of the updater. If not provided, defaults to the project creator."
    ),
  variables: z
    .array(z.string())
    .optional()
    .describe(
      "List of variable names used in the content with a Handlebars expression such as {{myField}}. Variable names are case-sensitive and should be simple identifiers (letters, numbers, underscores). To learn more about using Handlebars in Snippets, see Customizing Snippets with Variables."
    ),
});

export type UpdateSnippetParams = z.infer<typeof UpdateSnippetParamsSchema>;

export const DeleteSnippetParamsSchema = z.object({
  identifier: SnippetIdentifierSchema,
});

export type DeleteSnippetParams = z.infer<typeof DeleteSnippetParamsSchema>;

import { z } from "zod";

/** Unix timestamp for event tracking (API expects int64) */
export const UnixTimestampSchema = z.number().int();

/** ISO datetime string for scheduling (API expects ISO-8601) */
export const ISODateTimeSchema = z.string().datetime();

/** Flexible timestamp for responses (API returns various formats) */
export const FlexibleTimestampSchema = z.union([
  z.string().min(1),
  z.number().finite(),
]);

/** Accepts Date objects or date strings, converts to YYYY-MM-DD HH:MM:SS format for most Iterable endpoints */
export const IterableDateTimeSchema = z
  .union([
    z.date(),
    z.string().refine((str) => !isNaN(Date.parse(str)), "Invalid date string"),
  ])
  .transform((val) => {
    const date = val instanceof Date ? val : new Date(val);
    return date
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "");
  });

/** Accepts Date objects or date strings, converts to ISO-8601 format for scheduling endpoints */
export const IterableISODateTimeSchema = z
  .union([
    z.date(),
    z.string().refine((str) => !isNaN(Date.parse(str)), "Invalid date string"),
  ])
  .transform((val) =>
    (val instanceof Date ? val : new Date(val)).toISOString()
  );

export type UnixTimestamp = z.infer<typeof UnixTimestampSchema>;
export type ISODateTime = z.infer<typeof ISODateTimeSchema>;
export type FlexibleTimestamp = z.infer<typeof FlexibleTimestampSchema>;
export type IterableDateTime = z.infer<typeof IterableDateTimeSchema>;
export type IterableISODateTime = z.infer<typeof IterableISODateTimeSchema>;

// Error response codes returned by Iterable API (from official API docs)
export const IterableErrorResponseCodeSchema = z.enum([
  "BadApiKey",
  "BadAuthorizationHeader",
  "BadJsonBody",
  "BadParams",
  "BatchTooLarge",
  "DatabaseError",
  "EmailAlreadyExists",
  "ExternalKeyConflict",
  "Forbidden",
  "ForbiddenParamsError",
  "ForgottenUserError",
  "GenericError",
  "InvalidEmailAddressError",
  "InvalidJwtPayload",
  "InvalidUserIdError",
  "JwtUserIdentifiersMismatched",
  "NotFound",
  "QueueEmailError",
  "RateLimitExceeded",
  "RequestFieldsTypesMismatched",
  "Unauthorized",
  "UniqueFieldsLimitExceeded",
  "UnknownEmailError",
  "UnknownUserIdError",
  "UserIdAlreadyExists",
]);

export type IterableErrorResponseCode = z.infer<
  typeof IterableErrorResponseCodeSchema
>;

// All response codes (success + error codes)
export const IterableResponseCodeSchema = z.union([
  z.literal("Success"),
  IterableErrorResponseCodeSchema,
]);

export type IterableResponseCode = z.infer<typeof IterableResponseCodeSchema>;

// Success response for operations that return only success confirmation (create, update, delete)
// HTTP errors are thrown as exceptions by the base client, so methods only return success responses
export const IterableSuccessResponseSchema = z.object({
  msg: z.string(),
  code: z.literal("Success"),
  params: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type IterableSuccessResponse = z.infer<
  typeof IterableSuccessResponseSchema
>;

// Error response structure (used for validation in error handling, not method return types)
// Note: Iterable sometimes returns "Success" code even for error responses
export const IterableErrorResponseSchema = z.object({
  msg: z.string(),
  code: z.union([IterableErrorResponseCodeSchema, z.literal("Success")]),
  params: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type IterableErrorResponse = z.infer<typeof IterableErrorResponseSchema>;

export const IterableConfigSchema = z.object({
  apiKey: z.string(),
  baseUrl: z.string().optional(),
  timeout: z.number().optional(),
  debug: z.boolean().optional(),
  debugVerbose: z.boolean().optional(),
  customHeaders: z.record(z.string(), z.string()).optional(),
});

export type IterableConfig = z.infer<typeof IterableConfigSchema>;

/**
 * Sorting parameters for paginated endpoints
 * @template TFields - Union of field names that can be sorted on
 */
export type SortParam<TFields extends string> = {
  field: TFields;
  direction?: "asc" | "desc";
};

/**
 * Creates a Zod schema for sort parameters
 * @template TFields - Union of field names that can be sorted on
 */
export function createSortParamSchema<TFields extends string>(
  fields: readonly TFields[]
) {
  return z
    .object({
      field: z.enum(fields as [TFields, ...TFields[]]),
      direction: z.enum(["asc", "desc"]).optional(),
    })
    .optional()
    .describe("Sort field with optional direction");
}

/**
 * Formats a sort parameter object into the API's string format
 * @param sort - Sort parameter object or undefined
 * @returns Formatted sort string (e.g., "-createdAt", "+name", "id") or undefined
 */
export function formatSortParam<TFields extends string>(
  sort: SortParam<TFields> | undefined
): string | undefined {
  if (!sort) return undefined;
  const prefix = sort.direction === "desc" ? "-" : "";
  return `${prefix}${sort.field}`;
}

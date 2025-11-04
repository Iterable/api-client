import {
  IterableErrorResponse,
  IterableErrorResponseCode,
  IterableErrorResponseSchema,
} from "./types/common.js";

// Base class for all Iterable-related errors
export abstract class IterableError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly endpoint?: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = this.constructor.name;
  }

  isAuthError = () => this.statusCode === 401;
  isValidationError = () => this.statusCode === 400;
  isNotFoundError = () => this.statusCode === 404;
  isRateLimitError = () => this.statusCode === 429;
  isForbiddenError = () => this.statusCode === 403;
  isServerError = () => this.statusCode >= 500;
  isClientError = () => this.statusCode >= 400 && this.statusCode < 500;
}

export class IterableApiError extends IterableError {
  public readonly code: IterableErrorResponseCode | "Success";
  public readonly params: Record<string, unknown> | null | undefined;

  constructor(
    public override readonly statusCode: number,
    public readonly apiResponse: IterableErrorResponse,
    public override readonly endpoint?: string,
    options?: ErrorOptions
  ) {
    super(apiResponse.msg, statusCode, endpoint, options);
    this.code = apiResponse.code;
    this.params = apiResponse.params;
  }
}

export class IterableRawError extends IterableError {
  constructor(
    public override readonly statusCode: number,
    public readonly rawResponse: unknown,
    public override readonly endpoint?: string,
    options?: ErrorOptions
  ) {
    super(
      extractErrorMessage(rawResponse, statusCode),
      statusCode,
      endpoint,
      options
    );
  }

  get truncatedResponse(): string {
    if (typeof this.rawResponse === "string") {
      return this.rawResponse.length > 500
        ? this.rawResponse.substring(0, 500) + "...[truncated]"
        : this.rawResponse;
    }
    return JSON.stringify(this.rawResponse);
  }
}

// For response validation errors (success response with wrong structure)
export class IterableResponseValidationError extends IterableError {
  constructor(
    public override readonly statusCode: number,
    public readonly rawResponse: unknown,
    public readonly validationError: string,
    public override readonly endpoint?: string,
    options?: ErrorOptions
  ) {
    super(
      `Response validation failed: ${validationError}`,
      statusCode,
      endpoint,
      options
    );
  }
}

// For network-level errors (no response received)
export class IterableNetworkError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "IterableNetworkError";
  }
}

export function isIterableError(error: unknown): error is IterableError {
  return error instanceof IterableError;
}

export function isIterableApiError(error: unknown): error is IterableApiError {
  return error instanceof IterableApiError;
}

export function isIterableRawError(error: unknown): error is IterableRawError {
  return error instanceof IterableRawError;
}

export function isIterableResponseValidationError(
  error: unknown
): error is IterableResponseValidationError {
  return error instanceof IterableResponseValidationError;
}

function extractErrorMessage(data: unknown, status: number): string {
  // Handle JSON objects that look like error responses
  const msg = (data as any)?.msg;
  if (typeof msg === "string") {
    return msg;
  }

  if (typeof data === "string") {
    // Try to extract meaningful info from HTML
    const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
    if (titleMatch) {
      return titleMatch.replace(/\s+/g, " ").trim();
    }

    // Look for error content in common HTML patterns
    const errorMatch = data.match(
      /<h[1-6][^>]*>([^<]*(?:error|not found|failed)[^<]*)<\/h[1-6]>/i
    )?.[1];
    if (errorMatch) {
      return errorMatch
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    // If it's a short string, use it directly
    if (data.length < 200 && !data.includes("<")) {
      return data.trim();
    }
  }

  return `HTTP ${status} error`;
}

export function createIterableError(error: any): Error {
  if (error.response) {
    const { status, data } = error.response;
    const url = error.config?.url;

    let parsedData = data;
    if (typeof data === "string") {
      try {
        parsedData = JSON.parse(data);
      } catch {
        // Invalid JSON, keep as string
      }
    }

    if (parsedData && typeof parsedData === "object") {
      const validation = IterableErrorResponseSchema.safeParse(parsedData);
      if (validation.success) {
        return new IterableApiError(status, validation.data, url, {
          cause: error,
        });
      }
    }

    return new IterableRawError(status, data, url, { cause: error });
  }

  if (error.request) {
    return new IterableNetworkError(
      "Network error: No response received from Iterable API",
      error,
      { cause: error }
    );
  }

  return new Error(`Request setup error: ${error.message}`, { cause: error });
}

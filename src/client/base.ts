import { readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import axios, { AxiosInstance, AxiosResponse } from "axios";
import { parse as csvParse } from "csv-parse/sync";
import { z } from "zod";

import { createIterableConfig } from "../config.js";
import {
  createIterableError,
  IterableResponseValidationError,
} from "../errors.js";
import { logger } from "../logger.js";
import { IterableConfig } from "../types/common.js";

// Get package version for User-Agent header
const packageJson = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json"),
    "utf-8"
  )
);

// Export User-Agent value for reuse in other clients (like MCP server)
export const DEFAULT_USER_AGENT = `iterable-api/${packageJson.version}`;

/**
 * Base client with shared infrastructure for all Iterable API operations
 */
export class BaseIterableClient {
  public client: AxiosInstance;
  #httpAgent?: http.Agent;
  #httpsAgent?: https.Agent;

  constructor(config?: IterableConfig, injectedClient?: AxiosInstance) {
    const clientConfig = config || createIterableConfig();

    if (injectedClient) {
      this.client = injectedClient;
    } else {
      // Create agents with keepAlive for better performance
      this.#httpAgent = new http.Agent({
        keepAlive: true,
        keepAliveMsecs: 1000,
      });
      this.#httpsAgent = new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 1000,
      });

      const defaultHeaders = {
        "Api-Key": clientConfig.apiKey,
        "Content-Type": "application/json",
        "User-Agent": DEFAULT_USER_AGENT,
      };

      this.client = axios.create({
        baseURL: clientConfig.baseUrl || "https://api.iterable.com",
        headers: {
          ...defaultHeaders,
          ...(clientConfig.customHeaders || {}),
        },
        timeout: clientConfig.timeout || 30000,
        httpAgent: this.#httpAgent,
        httpsAgent: this.#httpsAgent,
        maxRedirects: 5,
      });
    }

    // Add error handling interceptor (always active)
    if (!injectedClient) {
      this.client.interceptors.response.use(
        (response) => response,
        (error) => {
          return Promise.reject(createIterableError(error));
        }
      );

      // Add debug logging interceptors (only when debug is enabled)
      // WARNING: Never enable debug mode in production as it may log sensitive information
      if (clientConfig.debug) {
        const sanitizeHeaders = (headers: any) => {
          if (!headers) return undefined;
          const sensitive = ["api-key", "authorization", "cookie", "set-cookie"];
          const sanitized = { ...headers };
          Object.keys(sanitized).forEach((key) => {
            if (sensitive.includes(key.toLowerCase())) {
              sanitized[key] = "[REDACTED]";
            }
          });
          return sanitized;
        };

        const sanitizeUrl = (url?: string) => {
          if (!url) return url;
          try {
            // Use the actual base URL for realistic parsing context
            const baseUrl = clientConfig.baseUrl || "https://api.iterable.com";
            const urlObj = new URL(url, baseUrl);
            const sensitive = ["api_key", "apiKey", "token", "secret"];
            
            let modified = false;
            sensitive.forEach(param => {
              if (urlObj.searchParams.has(param)) {
                urlObj.searchParams.set(param, "[REDACTED]");
                modified = true;
              }
            });

            if (!modified) return url;
            
            // If the input was an absolute URL, return the full sanitized URL
            if (/^https?:\/\//i.test(url)) {
              return urlObj.toString();
            }
            
            // For relative URLs, return just the path and query components
            return urlObj.pathname + urlObj.search;
          } catch {
            return url;
          }
        };

        this.client.interceptors.request.use((request) => {
          logger.debug("API request", {
            method: request.method?.toUpperCase(),
            url: sanitizeUrl(request.url),
            headers: sanitizeHeaders(request.headers),
          });
          return request;
        });

        const createResponseLogData = (response: any, includeData = false) => ({
          status: response.status,
          url: sanitizeUrl(response.config?.url),
          ...(includeData && { data: response.data }),
        });

        this.client.interceptors.response.use(
          (response) => {
            logger.debug(
              "API response",
              createResponseLogData(response, clientConfig.debugVerbose)
            );
            return response;
          },
          (error) => {
            if (error.response) {
              // CRITICAL: Only log response data if verbose debug is enabled to prevent PII leaks
              logger.error(
                "API error",
                createResponseLogData(error.response, clientConfig.debugVerbose)
              );
            } else {
              logger.error("Network error", { message: error.message });
            }
            return Promise.reject(error);
          }
        );
      }
    }
  }

  /**
   * Parse NDJSON (newline-delimited JSON) response into an array of objects
   */
  public parseNdjson(data: string): any[] {
    if (!data) {
      return [];
    }

    const lines = data.trim().split("\n");
    const results: any[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        try {
          const parsed = JSON.parse(trimmedLine);
          results.push(parsed);
        } catch (error) {
          // Skip invalid JSON lines but log them
          logger.warn("Failed to parse NDJSON line", {
            line: trimmedLine,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    return results;
  }

  /**
   * Parse CSV response into an array of objects using csv-parse library
   * @throws IterableResponseValidationError if CSV parsing fails
   */
  public parseCsv(response: AxiosResponse<string>): Record<string, string>[] {
    if (!response.data) {
      return [];
    }

    try {
      return csvParse(response.data, {
        columns: true, // Use first line as headers
        skip_empty_lines: true,
        trim: true,
      });
    } catch (error) {
      // Throw validation error to maintain consistent error handling
      // This allows callers to handle parse failures appropriately
      throw new IterableResponseValidationError(
        200,
        response.data,
        `CSV parse error: ${error instanceof Error ? error.message : String(error)}`,
        response.config?.url
      );
    }
  }

  public validateResponse<T>(
    response: { data: unknown; config?: { url?: string } },
    schema: z.ZodSchema<T>
  ): T {
    const result = schema.safeParse(response.data);
    if (!result.success) {
      throw new IterableResponseValidationError(
        200,
        response.data,
        result.error.message,
        response.config?.url
      );
    }
    return result.data;
  }

  /**
   * Clean up HTTP agents to prevent Jest from hanging
   * Should be called when the client is no longer needed
   */
  public destroy(): void {
    this.#httpAgent?.destroy();
    this.#httpsAgent?.destroy();
  }
}

// Type helper for mixins
export type Constructor<T = object> = new (...args: any[]) => T;

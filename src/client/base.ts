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

  constructor(config?: IterableConfig, injectedClient?: AxiosInstance) {
    const clientConfig = config || createIterableConfig();

    if (injectedClient) {
      this.client = injectedClient;
    } else {
      const defaultHeaders = {
        "Api-Key": clientConfig.apiKey,
        "Content-Type": "application/json",
        "User-Agent": DEFAULT_USER_AGENT,
      };

      this.client = axios.create({
        baseURL: clientConfig.baseUrl,
        headers: {
          ...defaultHeaders,
          ...(clientConfig.customHeaders || {}),
        },
        timeout: clientConfig.timeout || 30000,
        httpAgent: new http.Agent({
          keepAlive: true,
          keepAliveMsecs: 1000,
        }),
        httpsAgent: new https.Agent({
          keepAlive: true,
          keepAliveMsecs: 1000,
        }),
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
          const sensitive = [
            "api-key",
            "authorization",
            "cookie",
            "set-cookie",
          ];
          const sanitized = { ...headers };
          Object.keys(sanitized).forEach((key) => {
            if (sensitive.includes(key.toLowerCase())) {
              sanitized[key] = "[REDACTED]";
            }
          });
          return sanitized;
        };

        this.client.interceptors.request.use((request) => {
          logger.debug("API request", {
            method: request.method?.toUpperCase(),
            url: request.url,
            headers: sanitizeHeaders(request.headers),
          });
          return request;
        });

        const createResponseLogData = (response: any, includeData = false) => ({
          status: response.status,
          url: response.config?.url,
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
   * Clean up HTTP agents to prevent Jest from hanging
   * Should be called when the client is no longer needed
   */
  public destroy(): void {
    this.client.defaults.httpAgent?.destroy();
    this.client.defaults.httpsAgent?.destroy();
  }
}

/**
 * @throws IterableResponseValidationError if CSV parsing fails
 */
export function parseCsv(
  response: AxiosResponse<string>
): Record<string, string>[] {
  if (!response.data) {
    return [];
  }

  try {
    return csvParse(response.data, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    throw new IterableResponseValidationError(
      200,
      response.data,
      `CSV parse error: ${error instanceof Error ? error.message : String(error)}`,
      response.config?.url
    );
  }
}

export function validateResponse<T>(
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

// Type helper for mixins
export type Constructor<T = object> = new (...args: any[]) => T;

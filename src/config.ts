import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import type { IterableConfig } from "./types/common.js";

/**
 * Environment configuration with validation using t3-env
 * Single source of truth for all environment variables
 */
export const config = createEnv({
  server: {
    // API Configuration
    ITERABLE_API_KEY: z.string().optional(),
    ITERABLE_BASE_URL: z.url().default("https://api.iterable.com"),
    API_TIMEOUT: z.coerce.number().positive().default(30000),
    ITERABLE_DEBUG: z.coerce.boolean().default(false),
    ITERABLE_DEBUG_VERBOSE: z.coerce.boolean().default(false),

    // Logging Configuration
    LOG_LEVEL: z
      .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
      .default(
        !process.env.NODE_ENV || process.env.NODE_ENV === "production"
          ? "info"
          : "debug"
      ),
    LOG_JSON: z.coerce.boolean().default(process.env.NODE_ENV === "production"),
    LOG_FILE: z.string().optional(),
    LOG_STDERR: z.coerce.boolean().default(true),

    // Server Configuration
    SHUTDOWN_TIMEOUT: z.coerce.number().positive().default(30000),

    // Test Configuration
    CLEANUP_TEST_DATA: z.coerce.boolean().default(true),
    TEST_TIMEOUT: z.coerce.number().positive().default(15000),

    // Node Environment
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

/**
 * Create IterableClient config from environment variables
 * Used internally by IterableClient constructor
 */
export function createIterableConfig(): IterableConfig {
  if (!config.ITERABLE_API_KEY) {
    throw new Error("ITERABLE_API_KEY environment variable is required");
  }

  return {
    apiKey: config.ITERABLE_API_KEY,
    baseUrl: config.ITERABLE_BASE_URL,
    timeout: config.API_TIMEOUT,
    debug: config.ITERABLE_DEBUG || config.ITERABLE_DEBUG_VERBOSE,
    debugVerbose: config.ITERABLE_DEBUG_VERBOSE,
  };
}

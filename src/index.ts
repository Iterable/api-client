// Main exports for the Iterable API Client
export { BaseIterableClient, DEFAULT_USER_AGENT } from "./client/base.js";
export { IterableClient } from "./client/index.js";

// Export all types
export * from "./types/campaigns.js";
export * from "./types/catalogs.js";
export * from "./types/common.js";
export * from "./types/events.js";
export * from "./types/experiments.js";
export * from "./types/export.js";
export * from "./types/journeys.js";
export * from "./types/lists.js";
export * from "./types/messaging.js";
export * from "./types/snippets.js";
export * from "./types/subscriptions.js";
export * from "./types/templates.js";
export * from "./types/users.js";
export * from "./types/webhooks.js";

// Export error classes and utilities
export * from "./errors.js";

// Export configuration utilities
export { createIterableConfig } from "./config.js";
export type { IterableConfig } from "./types/common.js";

// Export logger
export { logger } from "./logger.js";

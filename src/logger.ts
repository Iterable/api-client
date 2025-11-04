import winston from "winston";

import { config } from "./config.js";

const structuredFormat = winston.format.printf(
  ({ level, message, timestamp, ...metadata }) => {
    const logObject = {
      timestamp,
      level,
      message,
      ...metadata,
    };
    return JSON.stringify(logObject);
  }
);

const transports: winston.transport[] = [];

if (config.LOG_FILE) {
  transports.push(
    new winston.transports.File({
      filename: config.LOG_FILE,
      format: config.LOG_JSON ? structuredFormat : winston.format.simple(),
    })
  );
}

if (config.LOG_STDERR) {
  // Log to stderr (never stdout to avoid breaking MCP protocol)
  // MCP servers communicate over stdin/stdout, so logs to stdout interfere with JSON-RPC messages
  transports.push(
    new winston.transports.Console({
      stderrLevels: Object.keys(winston.config.npm.levels),
      format: config.LOG_JSON ? structuredFormat : winston.format.simple(),
    })
  );
}

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    structuredFormat
  ),
  transports,
});

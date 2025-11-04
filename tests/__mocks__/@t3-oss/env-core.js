// Simplified mock for @t3-oss/env-core
export function createEnv({ server, runtimeEnv }) {
  const config = {};

  // Apply environment values or schema defaults
  for (const [key, schema] of Object.entries(server)) {
    // In Zod 4, defaultValue is the actual value, not a function
    const defaultValue = schema._def?.defaultValue;
    const value = runtimeEnv[key] ?? defaultValue;
    if (value !== undefined) {
      config[key] = value;
    }
  }

  return config;
}

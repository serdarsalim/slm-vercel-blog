// src/lib/env.ts

/**
 * Returns the value of a required environment variable.
 * Throws a descriptive error if the variable is missing so we fail fast at runtime.
 */
export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

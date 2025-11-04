/**
 * Custom Jest matchers for Iterable error types
 * Provides better error messages and type safety
 */

import { IterableApiError, IterableNetworkError } from "../../src/errors";

/**
 * Enhanced matcher that checks both instanceof and specific properties
 */
export async function expectIterableError<T extends IterableApiError>(
  promise: Promise<any>,
  ErrorClass: new (...args: any[]) => T,
  expectedProps?: Partial<T>
) {
  try {
    await promise;
    throw new Error(
      `Expected promise to reject with ${ErrorClass.name}, but it resolved`
    );
  } catch (error: any) {
    // Check if it's the right error type
    expect(error).toBeInstanceOf(ErrorClass);

    // Check specific properties if provided
    if (expectedProps) {
      for (const [key, value] of Object.entries(expectedProps)) {
        expect(error[key]).toBe(value);
      }
    }
  }
}

/**
 * Convenience functions for common error types
 */
export const expectAuthError = (promise: Promise<any>) =>
  expectIterableError(promise, IterableApiError, { statusCode: 401 });

export const expectValidationError = (
  promise: Promise<any>,
  statusCode = 400
) => expectIterableError(promise, IterableApiError, { statusCode });

export const expectNotFoundError = (promise: Promise<any>) =>
  expectIterableError(promise, IterableApiError, { statusCode: 404 });

export const expectRateLimitError = (promise: Promise<any>) =>
  expectIterableError(promise, IterableApiError, { statusCode: 429 });

export const expectNetworkError = async (promise: Promise<any>) => {
  await expect(promise).rejects.toThrow(IterableNetworkError);
};

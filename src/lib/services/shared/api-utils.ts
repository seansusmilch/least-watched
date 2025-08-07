export const DEFAULT_TIMEOUT = 10000; // 10 seconds

// Helper function to configure and make API calls with error handling
export async function safeApiCall<T>(
  apiCall: () => Promise<unknown>,
  defaultValue: T,
  context: string
): Promise<T> {
  try {
    const result = await apiCall();
    // Check if result has an error property (from RequestResult type)
    if (
      result &&
      typeof result === 'object' &&
      'error' in result &&
      result.error
    ) {
      console.warn(`${context}: API returned an error: ${result.error}`);
      return defaultValue;
    }
    // If data property exists, return it, otherwise return the result directly
    const finalResult =
      result && typeof result === 'object' && 'data' in result
        ? result.data
        : result;
    return finalResult as T;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`${context}:`, error);
    } else {
      console.warn(`${context}: Service unavailable, using default data`);
    }
    return defaultValue;
  }
}

// Helper function to create fetch with timeout
export function createFetchWithTimeout(timeout: number = DEFAULT_TIMEOUT) {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    return fetch(input, { ...init, signal: controller.signal }).finally(() =>
      clearTimeout(timeoutId)
    );
  };
}

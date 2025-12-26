/**
 * Safe JSON parsing utilities
 * Prevents crashes from invalid JSON in localStorage or API responses
 */

/**
 * Safely parse JSON string with fallback value
 * @param value - String to parse
 * @param fallback - Value to return if parsing fails
 * @returns Parsed value or fallback
 */
export const safeParse = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;

  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch (error) {
    console.warn('Failed to parse JSON, using fallback:', { error, value: value.substring(0, 100) });
    return fallback;
  }
};

/**
 * Safely stringify value with error handling
 * @param value - Value to stringify
 * @param fallback - String to return if stringification fails
 * @returns JSON string or fallback
 */
export const safeStringify = (value: any, fallback: string = '{}'): string => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('Failed to stringify value, using fallback:', error);
    return fallback;
  }
};

/**
 * Safe localStorage getItem with JSON parsing
 * @param key - localStorage key
 * @param fallback - Value to return if key doesn't exist or parsing fails
 * @returns Parsed value or fallback
 */
export const getLocalStorage = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return safeParse(item, fallback);
  } catch (error) {
    console.warn('Failed to access localStorage:', error);
    return fallback;
  }
};

/**
 * Safe localStorage setItem with JSON stringification
 * @param key - localStorage key
 * @param value - Value to store
 * @returns Success boolean
 */
export const setLocalStorage = (key: string, value: any): boolean => {
  try {
    const stringified = safeStringify(value);
    localStorage.setItem(key, stringified);
    return true;
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
    return false;
  }
};

/**
 * Safe localStorage removeItem
 * @param key - localStorage key
 * @returns Success boolean
 */
export const removeLocalStorage = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
    return false;
  }
};

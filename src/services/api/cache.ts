/**
 * Cache Helper Functions
 * Manual caching using AsyncStorage
 * No external caching library needed
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache:';
const CACHE_DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

/**
 * Get cached data if it exists and is not expired
 */
export const getCachedData = async <T>(
  key: string,
  ttl: number = CACHE_DEFAULT_TTL,
): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) {
      return null;
    }

    const cachedData: CachedData<T> = JSON.parse(cached);
    const cacheTTL = cachedData.ttl || ttl;
    const now = Date.now();

    // Check if cache is expired
    if (now - cachedData.timestamp > cacheTTL) {
      // Cache expired, remove it
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return cachedData.data;
  } catch (error) {
    console.error(`Error getting cached data for key ${key}:`, error);
    return null;
  }
};

/**
 * Set data in cache with optional TTL
 */
export const setCachedData = async <T>(
  key: string,
  data: T,
  ttl?: number,
): Promise<void> => {
  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };
    await AsyncStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify(cachedData),
    );
  } catch (error) {
    console.error(`Error setting cached data for key ${key}:`, error);
  }
};

/**
 * Remove cached data
 */
export const removeCachedData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.error(`Error removing cached data for key ${key}:`, error);
  }
};

/**
 * Clear all cached data
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
};

/**
 * Invalidate cache for a specific pattern
 */
export const invalidateCachePattern = async (
  pattern: string,
): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (key) =>
        key.startsWith(CACHE_PREFIX) && key.includes(pattern.replace('*', '')),
    );
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error(`Error invalidating cache pattern ${pattern}:`, error);
  }
};

/**
 * Cache Helper Tests
 */

import {
  getCachedData,
  setCachedData,
  removeCachedData,
  clearAllCache,
  invalidateCachePattern,
} from '@/services/api/cache';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage');

describe('Cache Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setCachedData', () => {
    it('stores data in cache', async () => {
      const testData = {id: 1, name: 'Test'};
      await setCachedData('test-key', testData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'cache:test-key',
        expect.stringContaining(JSON.stringify(testData)),
      );
    });

    it('stores data with custom TTL', async () => {
      const testData = {id: 1};
      await setCachedData('test-key', testData, 60000);

      const call = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const stored = JSON.parse(call[1]);
      expect(stored.ttl).toBe(60000);
    });
  });

  describe('getCachedData', () => {
    it('retrieves valid cached data', async () => {
      const testData = {id: 1, name: 'Test'};
      const cached = {
        data: testData,
        timestamp: Date.now(),
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(cached),
      );

      const result = await getCachedData('test-key');
      expect(result).toEqual(testData);
    });

    it('returns null for expired cache', async () => {
      const expiredCache = {
        data: {id: 1},
        timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(expiredCache),
      );
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      const result = await getCachedData('test-key');
      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cache:test-key');
    });

    it('returns null for missing cache', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getCachedData('test-key');
      expect(result).toBeNull();
    });
  });

  describe('removeCachedData', () => {
    it('removes cached data', async () => {
      await removeCachedData('test-key');

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('cache:test-key');
    });
  });

  describe('clearAllCache', () => {
    it('clears all cached data', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        'cache:key1',
        'cache:key2',
        'other:key',
      ]);

      await clearAllCache();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'cache:key1',
        'cache:key2',
      ]);
    });
  });

  describe('invalidateCachePattern', () => {
    it('invalidates cache matching pattern', async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        'cache:user:1',
        'cache:user:2',
        'cache:project:1',
      ]);

      await invalidateCachePattern('user:*');

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'cache:user:1',
        'cache:user:2',
      ]);
    });
  });
});

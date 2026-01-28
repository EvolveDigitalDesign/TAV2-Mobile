/**
 * API utility functions
 * Compatible with TAV2 web app patterns
 * Adapted for React Native (AsyncStorage instead of localStorage)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {TOKEN_KEY} from '../config/env';

export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const createAuthHeaders = async (
  token?: string | null,
): Promise<Record<string, string>> => {
  const authToken = token || (await getAuthToken());
  return {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };
};

export const handleApiError = (error: unknown): void => {
  console.error('API Error:', error);
  // You can add more sophisticated error handling here
  // For example, showing a toast notification or redirecting to an error page
};

/**
 * Environment configuration
 * Loads environment variables for the app
 * Handles different environments: development, staging, production
 */

// Determine if we're in development mode
const __DEV__ = process.env.NODE_ENV !== 'production';

// API Configuration
// For mobile apps, localhost behavior differs:
// - iOS Simulator: localhost works (same machine)
// - Android Emulator: Use 10.0.2.2 instead of localhost
// - Physical Devices: Use your machine's local IP (e.g., 192.168.1.100)
const getApiUrl = (): string => {
  // Check for explicit API URL from environment
  if (process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }

  // Development defaults
  if (__DEV__) {
    // For Android emulator, use 10.0.2.2 to access host machine's localhost
    // For iOS simulator, localhost works fine
    // For physical devices, you'll need to set your machine's IP
    const platform = require('react-native').Platform.OS;
    
    if (platform === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine
      return 'http://10.0.2.2:8000';
    } else {
      // iOS simulator can use localhost
      return 'http://localhost:8000';
    }
  }

  // Production default (should be set via environment variable)
  return 'https://api.yourdomain.com';
};

export const API_URL = getApiUrl();

// Token Keys
export const TOKEN_KEY =
  process.env.VITE_TOKEN_KEY || 'access_token';
export const REFRESH_TOKEN_KEY =
  process.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token';
export const USER_DATA_KEY =
  process.env.VITE_USER_DATA_KEY || 'user_data';

// Validate required environment variables
if (!API_URL) {
  console.warn('API_URL is not set. Using default.');
}

// Log API URL in development for debugging
if (__DEV__) {
  console.log('API URL:', API_URL);
}

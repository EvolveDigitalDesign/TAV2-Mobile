/**
 * Environment configuration
 * Loads environment variables for the app
 */

// API Configuration
export const API_URL = process.env.VITE_API_URL || 'http://localhost:8000';

// Token Keys
export const TOKEN_KEY = process.env.VITE_TOKEN_KEY || 'access_token';
export const REFRESH_TOKEN_KEY =
  process.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token';
export const USER_DATA_KEY = process.env.VITE_USER_DATA_KEY || 'user_data';

// Validate required environment variables
if (!API_URL) {
  console.warn('VITE_API_URL is not set. Using default: http://localhost:8000');
}

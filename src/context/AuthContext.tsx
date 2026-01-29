/**
 * Authentication Context
 * Compatible with TAV2 web app patterns
 * Adapted for React Native (AsyncStorage instead of localStorage)
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthContextProps, AuthState, User} from '../types/auth.types';
import apiClient from '../services/api/client';
import {API_URL, TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY} from '../config/env';
import {base64Decode} from '../utils/base64';

// JWT token validation
const isTokenValid = (token: string): boolean => {
  if (!token) {
    return false;
  }

  try {
    const payload = JSON.parse(base64Decode(token.split('.')[1]));
    const expirationTime = payload.exp * 1000;
    return Date.now() < expirationTime;
  } catch {
    return false;
  }
};

const AuthContext = createContext<AuthContextProps>({
  authState: {
    token: null,
    refreshToken: null,
    authenticated: null,
    user: undefined,
  },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const refreshTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    refreshToken: null,
    authenticated: null,
    user: undefined,
  });

  // Function to clear auth state
  const clearAuthStateAndRedirect = useCallback(async () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    if (refreshTimeoutIdRef.current) {
      clearTimeout(refreshTimeoutIdRef.current);
      refreshTimeoutIdRef.current = null;
    }

    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY]);

    setAuthState({
      token: null,
      refreshToken: null,
      authenticated: false,
      user: undefined,
    });
  }, []);

  // Token validity check
  const checkTokenValidity = useCallback(() => {
    if (authState.token && !isTokenValid(authState.token)) {
      clearAuthStateAndRedirect();
    }
  }, [authState.token, clearAuthStateAndRedirect]);

  // Token refresh function - defined early so it can be used in loadAuthState
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshTokenValue = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshTokenValue) {
        return false;
      }

      const response = await apiClient.post('/api/token/refresh/', {
        refresh: refreshTokenValue,
      });

      const {access} = response.data;
      await AsyncStorage.setItem(TOKEN_KEY, access);

      setAuthState((prev) => ({
        ...prev,
        token: access,
      }));

      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await clearAuthStateAndRedirect();
      return false;
    }
  }, [clearAuthStateAndRedirect]);

  // Set up periodic token check
  useEffect(() => {
    checkIntervalRef.current = setInterval(checkTokenValidity, 60000); // Check every minute
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [checkTokenValidity]);

  // Load auth state from AsyncStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        const storedUserData = await AsyncStorage.getItem(USER_DATA_KEY);

        if (storedToken && storedRefreshToken) {
          if (isTokenValid(storedToken)) {
            let user: User | undefined;
            if (storedUserData) {
              try {
                user = JSON.parse(storedUserData);
              } catch (error) {
                console.error('Failed to parse stored user data:', error);
                await AsyncStorage.removeItem(USER_DATA_KEY);
              }
            }

            // If no user data, try to fetch it
            if (!user) {
              try {
                const userResponse = await apiClient.get('/api/user/info/');
                user = userResponse.data;
                await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
              } catch (error) {
                console.error('Failed to fetch user info:', error);
                await clearAuthStateAndRedirect();
                return;
              }
            }

            setAuthState({
              token: storedToken,
              refreshToken: storedRefreshToken,
              authenticated: true,
              user,
            });

            // Set refresh timeout after loading state
            setTimeout(() => {
              setRefreshTimeout();
            }, 0);
          } else {
            // Token expired, try to refresh
            const refreshed = await refreshToken();
            if (refreshed) {
              // If refresh succeeded, set timeout for new token
              setTimeout(() => {
                setRefreshTimeout();
              }, 0);
            } else {
              await clearAuthStateAndRedirect();
            }
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      }
    };

    loadAuthState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearAuthStateAndRedirect]);

  // Set refresh timeout and auto-refresh
  const DEFAULT_EXPIRES_IN = 18 * 60 * 60; // 18 hours in seconds
  const REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // Refresh 5 minutes before expiry

  const setRefreshTimeout = useCallback(() => {
    if (refreshTimeoutIdRef.current) {
      clearTimeout(refreshTimeoutIdRef.current);
    }

    if (!authState.token) {
      return;
    }

    try {
      // Calculate token expiration time
        const payload = JSON.parse(base64Decode(authState.token.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = expirationTime - now;

      // Set timeout to refresh 5 minutes before expiry
      const refreshTime = Math.max(
        timeUntilExpiry - REFRESH_BEFORE_EXPIRY,
        60000, // At least 1 minute
      );

      refreshTimeoutIdRef.current = setTimeout(async () => {
        const refreshed = await refreshToken();
        if (refreshed) {
          // If refresh succeeded, set new timeout for the refreshed token
          setTimeout(() => {
            setRefreshTimeout();
          }, 0);
        } else {
          // If refresh failed, clear auth after a short delay
          setTimeout(() => {
            clearAuthStateAndRedirect();
          }, 60000);
        }
      }, refreshTime);

      // Also set a final timeout for absolute expiration
      const finalTimeout = setTimeout(() => {
        clearAuthStateAndRedirect();
      }, timeUntilExpiry);
    } catch (error) {
      console.error('Error setting refresh timeout:', error);
      // Fallback to default timeout
      const timeoutDuration = DEFAULT_EXPIRES_IN * 1000;
      refreshTimeoutIdRef.current = setTimeout(() => {
        clearAuthStateAndRedirect();
      }, timeoutDuration);
    }
  }, [authState.token, refreshToken, clearAuthStateAndRedirect]);

  // Login handler
  const onLogin = useCallback(
    async (email: string, password: string) => {
      try {
        // Get the access token
        const tokenResponse = await apiClient.post('/api/token/', {
          email,
          password,
        });

        const {access, refresh, user: tokenUser} = tokenResponse.data;

        // Save token to AsyncStorage FIRST so subsequent requests can use it
        await AsyncStorage.setItem(TOKEN_KEY, access);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);

        // Get user info - now the interceptor will have the token
        // Also pass the header directly in case AsyncStorage read is slow
        const userResponse = await apiClient.get('/api/user/info/', {
          headers: {
            Authorization: `Bearer ${access}`,
          },
        });
        const userInfo = userResponse.data;

        console.log('📱 User info from API:', JSON.stringify(userInfo, null, 2));

        // Merge token user data with user info
        const user: User = {
          ...userInfo,
          permissions: tokenUser?.permissions || [],
          tenant_user: tokenUser?.tenant_user || userInfo.tenant_user,
          // Map tenant object properly (API returns 'tenant' as full object)
          primary_tenant: userInfo.tenant || undefined,
        };

        // Add tenant slug
        if (user.tenant?.name) {
          user.tenant.slug = user.tenant.name.toLowerCase().replace(/\s+/g, '-');
        }
        
        console.log('📱 User object after processing:', {
          id: user.id,
          email: user.email,
          tenant: user.tenant,
          primary_tenant: user.primary_tenant,
        });

        // Store user data in AsyncStorage (tokens already saved above)
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

        setAuthState({
          token: access,
          refreshToken: refresh,
          authenticated: true,
          user,
        });

        // Set refresh timeout after state update
        // Use setTimeout to ensure state is updated first
        setTimeout(() => {
          setRefreshTimeout();
        }, 0);

        return {access_token: access, refresh_token: refresh, user};
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    [setRefreshTimeout],
  );

  // Logout handler
  const onLogout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout/');
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    } finally {
      await clearAuthStateAndRedirect();
    }
  }, [clearAuthStateAndRedirect]);

  // Permission checker
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!authState.user?.permissions) {
        return false;
      }

      return authState.user.permissions.includes(permission);
    },
    [authState.user],
  );

  const value: AuthContextProps = {
    authState,
    onLogin,
    onLogout,
    hasPermission,
    refreshToken, // Expose refreshToken for manual refresh if needed
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

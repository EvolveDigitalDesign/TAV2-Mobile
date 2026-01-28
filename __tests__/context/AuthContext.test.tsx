/**
 * Auth Context Tests
 */

import React from 'react';
import {renderHook, act, waitFor} from '@testing-library/react-native';
import {AuthProvider, useAuth} from '../../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../src/services/api/client';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../src/services/api/client');

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides auth state', () => {
    const {result} = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Initially authenticated is null (not yet determined)
    expect(result.current.authState.authenticated).toBeNull();
    expect(result.current.authState.user).toBeUndefined();
  });

  it('logs in successfully', async () => {
    const mockTokenResponse = {
      data: {
        access: 'access-token',
        refresh: 'refresh-token',
        user: {id: 1, email: 'test@example.com', permissions: []},
      },
    };

    const mockUserResponse = {
      data: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_staff: false,
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockTokenResponse);
    (apiClient.get as jest.Mock).mockResolvedValue(mockUserResponse);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    const {result} = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.onLogin?.('test@example.com', 'password');
    });

    await waitFor(() => {
      expect(result.current.authState.authenticated).toBe(true);
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      expect.any(String),
      'access-token',
    );
    expect(result.current.authState.user?.email).toBe('test@example.com');
  });

  it('logs out successfully', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token');
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({id: 1}),
    );
    (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);
    (apiClient.post as jest.Mock).mockResolvedValue({});

    const {result} = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.onLogout?.();
    });

    expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    expect(result.current.authState.authenticated).toBe(false);
  });

  it('checks permissions correctly', async () => {
    const mockTokenResponse = {
      data: {
        access: 'access-token',
        refresh: 'refresh-token',
        user: {id: 1, email: 'test@example.com', permissions: ['can_manage_rigs', 'can_view_reports']},
      },
    };

    const mockUserResponse = {
      data: {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_staff: false,
        permissions: ['can_manage_rigs', 'can_view_reports'],
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockTokenResponse);
    (apiClient.get as jest.Mock).mockResolvedValue(mockUserResponse);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    const {result} = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await act(async () => {
      await result.current.onLogin?.('test@example.com', 'password');
    });

    await waitFor(() => {
      expect(result.current.authState.authenticated).toBe(true);
    });

    expect(result.current.hasPermission?.('can_manage_rigs')).toBe(true);
    expect(result.current.hasPermission?.('invalid_permission')).toBe(false);
  });
});

/**
 * Basic App component test
 * Verifies the app renders without crashing
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import App from '../App';

// Mock AsyncStorage to prevent auth state loading issues
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

describe('App', () => {
  it('renders without crashing', () => {
    const {getByText} = render(<App />);
    expect(getByText('TAV2 Mobile')).toBeTruthy();
  });

  it('displays the sign in screen', () => {
    const {getAllByText} = render(<App />);
    const signInTexts = getAllByText('Sign In');
    expect(signInTexts.length).toBeGreaterThan(0);
  });
});

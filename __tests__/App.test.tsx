/**
 * Basic App component test
 * Verifies the app renders without crashing
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    const {getByText} = render(<App />);
    expect(getByText('TAV2 Mobile')).toBeTruthy();
  });

  it('displays the subtitle', () => {
    const {getByText} = render(<App />);
    expect(getByText('React Native App')).toBeTruthy();
  });
});

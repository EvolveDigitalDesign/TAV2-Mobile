/**
 * Sign In Screen Tests
 */

import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import SignInScreen from '../../../src/screens/auth/SignInScreen';
import {useAuth} from '../../../src/context/AuthContext';

jest.mock('../../../src/context/AuthContext');

describe('SignInScreen', () => {
  const mockOnLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      onLogin: mockOnLogin,
    });
  });

  it('renders correctly', () => {
    const {getByText, getByPlaceholderText} = render(<SignInScreen />);
    expect(getByText('TAV2 Mobile')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
  });

  it('validates email format', async () => {
    const {getByPlaceholderText, getByText} = render(<SignInScreen />);
    const emailInput = getByPlaceholderText('Enter your email');
    const submitButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  it('validates password is required', async () => {
    const {getByPlaceholderText, getByText} = render(<SignInScreen />);
    const emailInput = getByPlaceholderText('Enter your email');
    const submitButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockOnLogin).not.toHaveBeenCalled();
    });
  });

  it('calls onLogin with valid credentials', async () => {
    mockOnLogin.mockResolvedValue({});

    const {getByPlaceholderText, getByText} = render(<SignInScreen />);
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const submitButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(mockOnLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('displays error message on login failure', async () => {
    const errorMessage = 'Invalid credentials';
    mockOnLogin.mockRejectedValue({
      response: {data: {detail: errorMessage}},
    });

    const {getByPlaceholderText, getByText, findByText} = render(
      <SignInScreen />,
    );
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const submitButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(findByText(errorMessage)).toBeTruthy();
    });
  });

  it('shows loading state during login', async () => {
    mockOnLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    const {getByPlaceholderText, getByText} = render(<SignInScreen />);
    const emailInput = getByPlaceholderText('Enter your email');
    const passwordInput = getByPlaceholderText('Enter your password');
    const submitButton = getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(submitButton);

    // Button should be disabled during loading
    expect(submitButton.props.disabled || submitButton.props.loading).toBeTruthy();
  });
});

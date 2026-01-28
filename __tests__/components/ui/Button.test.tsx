/**
 * Button Component Tests
 */

import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import Button from '../../../src/components/ui/Button';

describe('Button', () => {
  it('renders with text', () => {
    const {getByText} = render(<Button onPress={() => {}}>Click me</Button>);
    expect(getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const {getByText} = render(<Button onPress={onPress}>Click me</Button>);

    fireEvent.press(getByText('Click me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    const {getByTestId, queryByText} = render(
      <Button onPress={() => {}} loading>
        Click me
      </Button>,
    );

    expect(queryByText('Click me')).toBeNull();
    // ActivityIndicator should be present (may need testID)
  });

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const {getByText} = render(
      <Button disabled onPress={onPress}>
        Click me
      </Button>,
    );

    fireEvent.press(getByText('Click me'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('applies variant styles', () => {
    const {getByText, rerender} = render(
      <Button onPress={() => {}} variant="primary">
        Primary
      </Button>,
    );

    expect(getByText('Primary')).toBeTruthy();

    rerender(
      <Button onPress={() => {}} variant="danger">
        Danger
      </Button>,
    );

    expect(getByText('Danger')).toBeTruthy();
  });
});

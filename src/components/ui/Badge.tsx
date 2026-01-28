/**
 * Badge Component
 * Custom badge built from React Native primitives
 */

import React from 'react';
import {View, Text, StyleSheet, ViewStyle, TextStyle} from 'react-native';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'small' | 'medium';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  children,
  variant = 'primary',
  size = 'medium',
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: '#dbeafe',
  },
  secondary: {
    backgroundColor: '#f3f4f6',
  },
  success: {
    backgroundColor: '#d1fae5',
  },
  warning: {
    backgroundColor: '#fef3c7',
  },
  danger: {
    backgroundColor: '#fee2e2',
  },
  size_small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  size_medium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: '#1e40af',
  },
  text_secondary: {
    color: '#374151',
  },
  text_success: {
    color: '#065f46',
  },
  text_warning: {
    color: '#92400e',
  },
  text_danger: {
    color: '#991b1b',
  },
});

/**
 * Dashboard Screen
 * Placeholder for Crew Supervisor Dashboard
 * Will be implemented in Phase 6
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useAuth} from '../../context/AuthContext';

export default function DashboardScreen() {
  const {authState} = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        Welcome, {authState.user?.email || 'User'}
      </Text>
      <Text style={styles.description}>
        Crew Supervisor Dashboard will be implemented in Phase 6
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#9ca3af',
  },
});

/**
 * Profile Screen
 * User profile display and management
 */

import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {Card, Button} from '../../components/ui';

export default function ProfileScreen() {
  const {authState, onLogout} = useAuth();
  const {user} = authState;

  const handleLogout = async () => {
    try {
      await onLogout?.();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        {user && (
          <Card style={styles.profileCard}>
            <View style={styles.profileSection}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>

            {user.first_name && (
              <View style={styles.profileSection}>
                <Text style={styles.label}>First Name</Text>
                <Text style={styles.value}>{user.first_name}</Text>
              </View>
            )}

            {user.last_name && (
              <View style={styles.profileSection}>
                <Text style={styles.label}>Last Name</Text>
                <Text style={styles.value}>{user.last_name}</Text>
              </View>
            )}

            {user.tenant && (
              <View style={styles.profileSection}>
                <Text style={styles.label}>Tenant</Text>
                <Text style={styles.value}>{user.tenant.name}</Text>
              </View>
            )}

            {user.tenant_user?.role && (
              <View style={styles.profileSection}>
                <Text style={styles.label}>Role</Text>
                <Text style={styles.value}>{user.tenant_user.role}</Text>
              </View>
            )}
          </Card>
        )}

        <Button onPress={handleLogout} variant="danger" fullWidth>
          Log Out
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#111827',
  },
  profileCard: {
    marginBottom: 24,
  },
  profileSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#111827',
  },
});

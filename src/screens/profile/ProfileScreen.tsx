/**
 * Profile Screen
 * User profile display and management
 * Note: Offline mode toggle has been moved to the AppHeader for easy access
 */

import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {Card, Button} from '../../components/ui';
import {SyncStatusIndicator} from '../../components/offline';
import {useIsOfflineMode} from '../../context/OfflineContext';

export default function ProfileScreen() {
  const {authState, onLogout} = useAuth();
  const {user} = authState;
  const isOfflineMode = useIsOfflineMode();

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

            {user.assigned_departments && user.assigned_departments.length > 0 && (
              <View style={styles.profileSection}>
                <Text style={styles.label}>Assigned Rig</Text>
                <Text style={styles.value}>
                  {user.assigned_departments.map(d => d.name).join(', ')}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Sync Status - detailed view when in offline mode */}
        {isOfflineMode && (
          <>
            <Text style={styles.sectionTitle}>Sync Status</Text>
            <SyncStatusIndicator style={styles.syncStatus} />
          </>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
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
  syncStatus: {
    marginBottom: 24,
  },
});

/**
 * Dashboard Screen
 * Crew Supervisor Dashboard with real data
 * Displays active jobs, KPIs, and quick actions
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useIsOnline } from '../../context/NetworkContext';
import { useOffline, useIsOfflineMode } from '../../context/OfflineContext';
import { Card, Badge, Loading } from '../../components/ui';
import {
  fetchActiveSubprojects,
  fetchAllSubprojects,
  getOfflineSubprojects,
  Subproject,
} from '../../services/api/subprojectApi';
import {
  fetchDWRSummary,
  DWRSummary,
  getOfflineDWRs,
} from '../../services/api/dwrApi';
import { OfflineSubproject, OfflineDWR } from '../../types/offline.types';
import { API_URL } from '../../config/env';

// ===============================
// Types
// ===============================

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: string;
  onPress?: () => void;
}

interface JobCardProps {
  job: Subproject | OfflineSubproject;
  onPress?: () => void;
}

// ===============================
// Sub-components
// ===============================

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  color = '#3B82F6',
  onPress,
}) => (
  <TouchableOpacity
    style={styles.metricCard}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Text style={styles.metricValue} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.metricTitle}>{title}</Text>
    {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    <View style={[styles.metricIndicator, { backgroundColor: color }]} />
  </TouchableOpacity>
);

const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  // Handle both online and offline job types
  const name = job.name;
  const jobNumber = job.job_number;
  const wellName = 'well' in job ? job.well?.name : job.well_name;
  const customerName = 'well' in job 
    ? job.well?.customer?.name 
    : job.customer_name;
  const rigName = 'assigned_rig' in job 
    ? job.assigned_rig?.name 
    : job.assigned_rig_name;

  return (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobName} numberOfLines={1}>
          {name}
        </Text>
        <Badge variant="success" size="sm">
          Active
        </Badge>
      </View>
      
      {jobNumber && (
        <Text style={styles.jobNumber}>Job #{jobNumber}</Text>
      )}
      
      <View style={styles.jobDetails}>
        {wellName && (
          <View style={styles.jobDetailRow}>
            <Text style={styles.jobDetailLabel}>Well:</Text>
            <Text style={styles.jobDetailValue} numberOfLines={1}>
              {wellName}
            </Text>
          </View>
        )}
        {customerName && (
          <View style={styles.jobDetailRow}>
            <Text style={styles.jobDetailLabel}>Customer:</Text>
            <Text style={styles.jobDetailValue} numberOfLines={1}>
              {customerName}
            </Text>
          </View>
        )}
        {rigName && (
          <View style={styles.jobDetailRow}>
            <Text style={styles.jobDetailLabel}>Rig:</Text>
            <Text style={styles.jobDetailValue} numberOfLines={1}>
              {rigName}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyStateIcon}>📋</Text>
    <Text style={styles.emptyStateText}>{message}</Text>
  </View>
);

// ===============================
// Main Component
// ===============================

export default function DashboardScreen() {
  const { authState } = useAuth();
  const isOnline = useIsOnline();
  const isOfflineMode = useIsOfflineMode();
  const { checkoutMetadata } = useOffline();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<(Subproject | OfflineSubproject)[]>([]);
  const [dwrSummary, setDwrSummary] = useState<DWRSummary | null>(null);
  const [offlineDWRs, setOfflineDWRs] = useState<OfflineDWR[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Get user's assigned rig
  const rigId = authState.user?.assigned_departments?.[0]?.id;
  const rigName = authState.user?.assigned_departments?.[0]?.name;

  // Fetch data
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    console.log('📊 Dashboard fetchData called:', { isOfflineMode, isOnline, rigId });

    try {
      if (isOfflineMode) {
        console.log('📊 Loading from local database (offline mode)');
        // Load from local database
        const [localJobs, localDWRs] = await Promise.all([
          getOfflineSubprojects(),
          getOfflineDWRs(),
        ]);

        console.log('📊 Local data loaded:', { 
          jobsCount: localJobs.length, 
          dwrsCount: localDWRs.length 
        });

        setJobs(localJobs);
        setOfflineDWRs(localDWRs);

        // Calculate summary from local DWRs
        const summary: DWRSummary = {
          total: localDWRs.length,
          draft: localDWRs.filter(d => d.status === 'draft').length,
          pending: localDWRs.filter(d => d.status === 'pending').length,
          in_progress: localDWRs.filter(d => d.status === 'in_progress').length,
          in_review: localDWRs.filter(d => d.status === 'in_review').length,
          approved: localDWRs.filter(d => d.status === 'approved').length,
          unapproved: localDWRs.filter(d => !d.is_approved).length,
        };
        setDwrSummary(summary);
      } else if (isOnline) {
        console.log('📊 Fetching from API (online mode)');
        let debugMessages: string[] = [`Mode: Online, rigId: ${rigId}`];
        debugMessages.push(`API: ${API_URL}`);
        debugMessages.push(`User: ${authState.user?.email || 'unknown'}`);
        debugMessages.push(`Token: ${authState.token ? 'present' : 'missing'}`);
        debugMessages.push(`Tenant: ${authState.user?.primary_tenant?.name || authState.user?.tenant?.name || 'none'}`);
        debugMessages.push(`TenantID: ${authState.user?.primary_tenant?.id || authState.user?.tenant?.id || 'none'}`);
        
        // Fetch from API
        // Note: We fetch subprojects filtered by rig, but DWR summary gets all DWRs
        // the user has access to (backend handles permissions)
        try {
          // First get ALL subprojects to see what we have
          const allJobs = await fetchAllSubprojects();
          const apiJobs = allJobs.filter(sp => sp.status === 'active');
          
          console.log('📊 API subprojects response:', { 
            totalCount: allJobs.length,
            activeCount: apiJobs.length,
            statuses: [...new Set(allJobs.map(j => j.status))],
            jobs: allJobs.map(j => ({ id: j.id, name: j.name, status: j.status }))
          });
          
          // Show detailed info about ALL subprojects found
          debugMessages.push(`Total subprojects: ${allJobs.length}`);
          debugMessages.push(`Active: ${apiJobs.length}`);
          
          // Show status breakdown
          const statusCounts = allJobs.reduce((acc, j) => {
            acc[j.status] = (acc[j.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          debugMessages.push(`Statuses: ${JSON.stringify(statusCounts)}`);
          
          if (allJobs.length > 0) {
            debugMessages.push(`First: ${allJobs[0].name} (${allJobs[0].status})`);
          }
          
          // Show all jobs (not just active) for debugging
          setJobs(allJobs);
        } catch (subprojectError: unknown) {
          const err = subprojectError as { message?: string; response?: { status: number; data: unknown } };
          console.error('📊 Error fetching subprojects:', subprojectError);
          debugMessages.push(`Subprojects ERROR: ${err.message || 'unknown'}`);
          if (err.response) {
            debugMessages.push(`Status: ${err.response.status}`);
            debugMessages.push(`Data: ${JSON.stringify(err.response.data).slice(0, 100)}`);
          }
          setJobs([]);
        }
        
        try {
          const apiSummary = await fetchDWRSummary();
          console.log('📊 API DWR summary:', apiSummary);
          debugMessages.push(`DWR Summary: total=${apiSummary.total}`);
          setDwrSummary(apiSummary);
        } catch (summaryError: unknown) {
          const err = summaryError as { message?: string };
          console.error('📊 Error fetching DWR summary:', summaryError);
          debugMessages.push(`DWR Summary ERROR: ${err.message || 'unknown'}`);
        }
        
        setDebugInfo(debugMessages.join('\n'));
      } else {
        // Offline but not in offline mode - try to load cached data
        const [localJobs, localDWRs] = await Promise.all([
          getOfflineSubprojects(),
          getOfflineDWRs(),
        ]);

        if (localJobs.length > 0 || localDWRs.length > 0) {
          setJobs(localJobs);
          setOfflineDWRs(localDWRs);
        } else {
          setError('No internet connection. Enable offline mode to access your records.');
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      
      // Try offline fallback
      try {
        const localJobs = await getOfflineSubprojects();
        if (localJobs.length > 0) {
          setJobs(localJobs);
          setError(null);
        }
      } catch {
        // Keep original error
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOfflineMode, isOnline, rigId]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loading size="large" text="Loading dashboard..." />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.userName}>
          {authState.user?.first_name || authState.user?.email?.split('@')[0] || 'User'}
        </Text>
        {rigName && (
          <Text style={styles.rigInfo}>Assigned to: {rigName}</Text>
        )}
      </View>

      {/* Debug Banner - REMOVE IN PRODUCTION */}
      {debugInfo ? (
        <View style={styles.debugBanner}>
          <Text style={styles.debugTitle}>🔍 Debug Info:</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      ) : null}

      {/* Offline Mode Banner */}
      {isOfflineMode && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerIcon}>⚡</Text>
          <View style={styles.offlineBannerContent}>
            <Text style={styles.offlineBannerTitle}>Offline Mode Active</Text>
            <Text style={styles.offlineBannerText}>
              {checkoutMetadata?.record_count || 0} records available offline
            </Text>
          </View>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Metrics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Active Jobs"
            value={jobs.length}
            color="#10B981"
          />
          <MetricCard
            title="In Progress"
            value={dwrSummary?.in_progress || 0}
            color="#3B82F6"
          />
          <MetricCard
            title="Pending Review"
            value={dwrSummary?.in_review || 0}
            color="#F59E0B"
          />
          <MetricCard
            title="Unapproved"
            value={dwrSummary?.unapproved || 0}
            subtitle="Need attention"
            color={dwrSummary?.unapproved ? '#EF4444' : '#10B981'}
          />
        </View>
      </View>

      {/* Active Jobs Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Jobs</Text>
          <Badge variant="info" size="sm">
            {jobs.length}
          </Badge>
        </View>

        {jobs.length > 0 ? (
          <View style={styles.jobsList}>
            {jobs.map((job, index) => (
              <JobCard
                key={'server_id' in job ? job.server_id : job.id || index}
                job={job}
                onPress={() => {
                  // TODO: Navigate to job details
                  console.log('Navigate to job:', job.name);
                }}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyJobsContainer}>
            <Text style={styles.emptyJobsIcon}>📋</Text>
            <Text style={styles.emptyJobsTitle}>No Subprojects Found</Text>
            <Text style={styles.emptyJobsText}>
              No subprojects are currently assigned to your tenant ({authState.user?.primary_tenant?.name || authState.user?.tenant?.name || 'Unknown'}).
            </Text>
            <Text style={styles.emptyJobsHint}>
              Verify in the web app that subprojects exist for this user.
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>📝</Text>
            <Text style={styles.actionButtonText}>New DWR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>📋</Text>
            <Text style={styles.actionButtonText}>View Records</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>⏱️</Text>
            <Text style={styles.actionButtonText}>Time Entry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonIcon}>💰</Text>
            <Text style={styles.actionButtonText}>Charges</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline DWRs Section (when in offline mode) */}
      {isOfflineMode && offlineDWRs.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Checked Out Records</Text>
            <Badge variant="warning" size="sm">
              {offlineDWRs.length}
            </Badge>
          </View>
          <Card style={styles.offlineRecordsCard}>
            {offlineDWRs.slice(0, 5).map((dwr, index) => (
              <View key={dwr.local_id || index} style={styles.offlineRecordRow}>
                <View>
                  <Text style={styles.offlineRecordDate}>{dwr.date}</Text>
                  <Text style={styles.offlineRecordTicket}>
                    Ticket: {dwr.ticket_number || 'N/A'}
                  </Text>
                </View>
                <View style={styles.offlineRecordStatus}>
                  {dwr.has_local_changes && (
                    <Badge variant="warning" size="sm">Modified</Badge>
                  )}
                  <Badge 
                    variant={dwr.status === 'approved' ? 'success' : 'info'} 
                    size="sm"
                  >
                    {dwr.status}
                  </Badge>
                </View>
              </View>
            ))}
            {offlineDWRs.length > 5 && (
              <Text style={styles.moreRecords}>
                +{offlineDWRs.length - 5} more records
              </Text>
            )}
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

// ===============================
// Styles
// ===============================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  // Welcome Section
  welcomeSection: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  rigInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  // Offline Banner
  // Debug styles - REMOVE IN PRODUCTION
  debugBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    color: '#78350F',
    fontFamily: 'monospace',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  offlineBannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  offlineBannerContent: {
    flex: 1,
  },
  offlineBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
  },
  offlineBannerText: {
    fontSize: 14,
    color: '#3B82F6',
    marginTop: 2,
  },
  // Error Banner
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#991B1B',
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  metricIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  // Jobs List
  jobsList: {
    gap: 12,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  jobNumber: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  jobDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 6,
  },
  jobDetailRow: {
    flexDirection: 'row',
  },
  jobDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
    width: 80,
  },
  jobDetailValue: {
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
  },
  // Empty State
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Empty jobs container (more detailed)
  emptyJobsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyJobsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyJobsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyJobsText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  emptyJobsHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  actionButton: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
  },
  // Offline Records
  offlineRecordsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  offlineRecordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  offlineRecordDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  offlineRecordTicket: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  offlineRecordStatus: {
    flexDirection: 'row',
    gap: 6,
  },
  moreRecords: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    padding: 12,
    fontStyle: 'italic',
  },
});

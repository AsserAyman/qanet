import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocalPrayerLog } from '../utils/database/schema';

import { useI18n } from '../contexts/I18nContext';
import {
  useLastNightStats,
  useOfflineData,
  useOfflineStats,
  usePrayerLogs,
} from '../hooks/useOfflineData';
import { getVerseStatus, quranData } from '../utils/quranData';

export default function AllHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { isInitialized } = useOfflineData();
  const {
    logs,
    loading: logsLoading,
    refresh: refreshLogs,
    deleteLog,
  } = usePrayerLogs();
  const { refresh: refreshStats } = useOfflineStats();

  const [refreshing, setRefreshing] = React.useState(false);

  const styles = createStyles(isRTL, insets);

  const getSurahName = (name: string) => {
    const surah = quranData.find((s) => s.name === name);
    return isRTL ? surah?.nameAr || name : name;
  };

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshLogs(), refreshStats()]);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshLogs, refreshStats]);

  const handleEdit = React.useCallback((log: LocalPrayerLog) => {
    router.push(`/edit-prayer/${log.local_id}`);
  }, []);

  const { gradientColors } = useLastNightStats();

  if (!isInitialized || logsLoading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <LinearGradient colors={gradientColors} style={styles.background} />
        <Text
          style={{
            color: '#ffffff',
            fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
          }}
        >
          {t('loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.background} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? 'arrow-forward' : 'arrow-back'}
            size={24}
            color="#ffffff"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('prayerHistory')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#ffffff"
            colors={['#ffffff']}
          />
        }
      >
        <View style={styles.historyCard}>
          {logs.map((log, index, arr) => {
            const dateObj = new Date(log.date);
            const dateStr = dateObj.toDateString();
            const showDate =
              index === 0 ||
              dateStr !== new Date(arr[index - 1].date).toDateString();

            // Calculate total verses for this date (from all logs)
            const dailyTotal = logs
              .filter((l) => new Date(l.date).toDateString() === dateStr)
              .reduce((sum, l) => sum + l.total_ayahs, 0);

            const dailyStatus = getVerseStatus(dailyTotal);

            const dateLabel = dateObj.toLocaleDateString(
              isRTL ? 'ar-SA' : 'en-US',
              {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              }
            );

            return (
              <React.Fragment key={log.local_id}>
                {showDate && (
                  <View style={styles.dateHeaderContainer}>
                    <View>
                      <Text style={styles.dateHeader}>{dateLabel}</Text>
                      <Text style={styles.dateSubHeader}>
                        {dailyTotal} {t('verses')}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.headerStatusBadge,
                        { backgroundColor: dailyStatus.color + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.headerStatusText,
                          { color: dailyStatus.color },
                        ]}
                      >
                        {t(dailyStatus.status.toLowerCase().replace(' ', ''))}
                      </Text>
                    </View>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    styles.historyItem,
                    index === logs.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => handleEdit(log)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.historyIconContainer,
                      { backgroundColor: getStatusColor(log.status) + '15' },
                    ]}
                  >
                    <Feather
                      name="moon"
                      size={20}
                      color={getStatusColor(log.status)}
                    />
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyRange}>
                      {getSurahName(log.start_surah)} {log.start_ayah} →{' '}
                      {getSurahName(log.end_surah)} {log.end_ayah}
                    </Text>
                    <View style={styles.metaContainer}>
                      <Text style={styles.historyVerses}>
                        {log.total_ayahs} {t('verses')}
                      </Text>
                      {log.sync_status !== 'synced' && (
                        <View
                          style={[
                            styles.syncIndicator,
                            {
                              backgroundColor: getSyncStatusColor(
                                log.sync_status
                              ),
                            },
                          ]}
                        />
                      )}
                    </View>
                  </View>
                  <Feather
                    name={isRTL ? 'chevron-left' : 'chevron-right'}
                    size={16}
                    color="rgba(255,255,255,0.3)"
                  />
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
          {logs.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{t('noHistoryYet')}</Text>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Mokantar':
      return '#a855f7';
    case 'Qanet':
      return '#22c55e';
    case 'Not Negligent':
      return '#3b82f6';
    default:
      return '#ef4444';
  }
}

function getSyncStatusColor(syncStatus: string): string {
  switch (syncStatus) {
    case 'pending':
      return '#eab308';
    case 'error':
      return '#ef4444';
    case 'conflict':
      return '#f97316';
    default:
      return '#22c55e';
  }
}

const createStyles = (isRTL: boolean, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    background: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: '100%',
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: insets.top + 10,
      paddingBottom: 20,
      paddingHorizontal: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: 20,
    },
    historyCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    dateHeaderContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginTop: 12,
      marginBottom: 8,
    },
    dateHeader: {
      fontSize: 13,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.4)',
      textTransform: 'uppercase',
      letterSpacing: 1,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    dateSubHeader: {
      fontSize: 12,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.7)',
      marginTop: 2,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    headerStatusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerStatusText: {
      fontSize: 11,
      fontWeight: '600',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    historyItem: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    historyIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 16,
      marginLeft: isRTL ? 16 : 0,
    },
    historyContent: {
      flex: 1,
      justifyContent: 'center',
    },
    historyRange: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
      marginBottom: 6,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    metaContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 12,
    },
    historyVerses: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.5)',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    syncIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateText: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 16,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
  });

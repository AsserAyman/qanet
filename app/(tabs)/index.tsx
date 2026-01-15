import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useI18n } from '../../contexts/I18nContext';
import { useOfflineStats, usePrayerLogs } from '../../hooks/useOfflineData';
import { LocalPrayerLog } from '../../utils/database/schema';
import { getGradientColors, quranData } from '../../utils/quranData';

export default function NightPrayerScreen() {
  const { t, isRTL } = useI18n();
  const { logs, deleteLog } = usePrayerLogs();
  const { streak, yearlyData, refresh: refreshStats } = useOfflineStats();

  const lastEntry = logs.length > 0 ? logs[0] : null;

  const gradientColors = useMemo(() => {
    const totalVerses = lastEntry?.total_ayahs || 0;
    return getGradientColors(totalVerses);
  }, [lastEntry]);

  // Calculate stats from yearlyData
  const computedStats = React.useMemo(() => {
    const values = Object.values(yearlyData).map((d) => d.verses);
    const totalAyahs = values.reduce((sum, v) => sum + v, 0);
    const bestNight = values.length > 0 ? Math.max(...values) : 0;
    const averageAyahs =
      values.length > 0 ? Math.round(totalAyahs / values.length) : 0;
    return { totalAyahs, bestNight, averageAyahs };
  }, [yearlyData]);

  const styles = createStyles(isRTL);

  const getSurahName = (name: string) => {
    const surah = quranData.find((s) => s.name === name);
    return isRTL ? surah?.nameAr || name : name;
  };

  const handleDelete = React.useCallback(
    (log: LocalPrayerLog) => {
      Alert.alert(t('confirmDelete'), t('deleteConfirmMessage'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLog(log.local_id);
              await refreshStats();
            } catch (error) {
              console.error('Delete failed:', error);
            }
          },
        },
      ]);
    },
    [deleteLog, refreshStats, t]
  );

  const handleEdit = React.useCallback((log: LocalPrayerLog) => {
    router.push(`/edit-prayer/${log.local_id}`);
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={styles.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../assets/images/moon-image.png')}
            style={styles.heroMoonImage}
          />
          <Text style={styles.heroTitle}>Qanet</Text>
          <Text style={styles.heroSubtitle}>
            {t('calculateYourNightPrayerVerses')}
          </Text>
        </View>

        {/* Streak & Last Entry Card */}
        <View style={styles.dashboardCard}>
          <View style={styles.dashboardRow}>
            <View style={styles.dashboardItem}>
              <View style={styles.streakContainer}>
                <Text style={styles.streakNumber}>{streak}</Text>
                <Text style={styles.streakEmoji}>🔥</Text>
              </View>
              <Text style={styles.dashboardLabel}>{t('currentStreak')}</Text>
            </View>

            <View style={styles.dashboardDivider} />

            <View style={styles.dashboardItem}>
              {lastEntry ? (
                <>
                  <Text style={styles.lastEntryNumber}>
                    {lastEntry.total_ayahs}
                  </Text>
                  <Text style={styles.dashboardLabel}>{t('lastNight')}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.lastEntryNumber}>—</Text>
                  <Text style={styles.dashboardLabel}>{t('lastNight')}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>
              {computedStats.totalAyahs.toLocaleString()}
            </Text>
            <Text style={styles.quickStatLabel}>{t('totalVerses')}</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>
              {computedStats.bestNight}
            </Text>
            <Text style={styles.quickStatLabel}>{t('bestNight')}</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>
              {computedStats.averageAyahs}
            </Text>
            <Text style={styles.quickStatLabel}>{t('average')}</Text>
          </View>
        </View>

        {/* Recent History */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('recentHistory')}</Text>
            <TouchableOpacity onPress={() => router.push('/all-history')}>
              <Text style={styles.seeAllText}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.historyCard}>
            {logs.slice(0, 3).map((log, index, arr) => {
              const showDate =
                index === 0 ||
                new Date(log.date).toDateString() !==
                  new Date(arr[index - 1].date).toDateString();

              const dateLabel = new Date(log.date).toLocaleDateString(
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
                    <Text style={styles.dateHeader}>{dateLabel}</Text>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.historyItem,
                      index === logs.slice(0, 3).length - 1 && {
                        borderBottomWidth: 0,
                      },
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
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                getStatusColor(log.status) + '20',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(log.status) },
                            ]}
                          >
                            {t(log.status.toLowerCase().replace(' ', ''))}
                          </Text>
                        </View>
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
        </View>

        <View style={{ height: 100 }} />
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

const createStyles = (isRTL: boolean) =>
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
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      padding: 24,
      paddingTop: 60,
    },
    // Hero Section
    heroSection: {
      alignItems: 'center',
      marginBottom: 32,
    },
    heroMoonImage: {
      width: 140,
      height: 140,
      borderRadius: 70,
      marginBottom: 20,
    },
    heroTitle: {
      fontSize: 36,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    heroSubtitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    // Dashboard Card
    dashboardCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 24,
      padding: 24,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    dashboardRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    dashboardItem: {
      flex: 1,
      alignItems: 'center',
    },
    dashboardDivider: {
      width: 1,
      height: 60,
      backgroundColor: 'rgba(255,255,255,0.15)',
      marginHorizontal: 20,
    },
    streakContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    streakNumber: {
      fontSize: 42,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    streakEmoji: {
      fontSize: 28,
    },
    lastEntryNumber: {
      fontSize: 42,
      fontWeight: 'bold',
      color: '#ffffff',
    },
    dashboardLabel: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.5)',
      marginTop: 4,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    // Quick Stats
    quickStatsRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 12,
      marginBottom: 32,
    },
    quickStatCard: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.06)',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    quickStatNumber: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 4,
    },
    quickStatLabel: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.5)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    // Recent History Section
    historySection: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    seeAllText: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.7)',
      fontWeight: '600',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    historyCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    dateHeader: {
      fontSize: 13,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.4)',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 8,
      textAlign: isRTL ? 'right' : 'left',
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
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    syncIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    emptyState: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateText: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 16,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
  });

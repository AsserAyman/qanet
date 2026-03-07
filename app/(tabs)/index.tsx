import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedGradientBackground } from '../../components/AnimatedGradientBackground';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  calculateTotalAyahs,
  useExemptPeriods,
  useLastNightStats,
  useOfflineStats,
  usePrayerLogs,
} from '../../hooks/useOfflineData';
import { useStoreReview } from '../../hooks/useStoreReview';
import { LocalExemptPeriod, LocalPrayerLog } from '../../utils/database/schema';
import { formatLogSummary, getVerseStatus } from '../../utils/quranData';

export default function NightPrayerScreen() {
  const { t, isRTL } = useI18n();
  const { themedColorsEnabled } = useTheme();
  const { logs, deleteLog } = usePrayerLogs();
  const { periods } = useExemptPeriods();
  const {
    streak,
    longestStreak,
    yearlyData,
    refresh: refreshStats,
  } = useOfflineStats();
  const { totalVerses: lastNightTotal, gradientColors } =
    useLastNightStats(themedColorsEnabled);

  useStoreReview(streak, lastNightTotal);

  // Calculate stats from yearlyData
  const computedStats = React.useMemo(() => {
    const entries = Object.values(yearlyData);
    const totalAyahs = entries.reduce((sum, d) => sum + d.verses, 0);
    const bestNight =
      entries.length > 0 ? Math.max(...entries.map((d) => d.verses)) : 0;

    if (entries.length > 0) {
      // Count frequency of each status
      const statusCounts: Record<string, number> = {};
      entries.forEach((d) => {
        statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
      });

      // Find the dominant status (mode)
      let dominantStatusName = entries[0].status;
      let maxCount = 0;

      for (const status in statusCounts) {
        if (statusCounts[status] > maxCount) {
          maxCount = statusCounts[status];
          dominantStatusName = status;
        }
      }

      // Map dominant status name back to its status object (for color and localization)
      const representativeVerses =
        dominantStatusName === 'Muqantar'
          ? 1000
          : dominantStatusName === 'Qanet'
            ? 100
            : dominantStatusName === 'Not Negligent'
              ? 10
              : 0;

      const averageStatus = getVerseStatus(representativeVerses);
      const averageAyahs = Math.round(totalAyahs / entries.length);

      return { totalAyahs, bestNight, averageAyahs, averageStatus };
    }

    return {
      totalAyahs: 0,
      bestNight: 0,
      averageAyahs: 0,
      averageStatus: getVerseStatus(0),
    };
  }, [yearlyData]);

  const styles = createStyles(isRTL);

  const formatRecitationRange = (log: LocalPrayerLog): string => {
    return formatLogSummary(log.recitations, isRTL, t('more'));
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
              await deleteLog(log.id);
              await refreshStats();
            } catch (error) {
              console.error('Delete failed:', error);
            }
          },
        },
      ]);
    },
    [deleteLog, refreshStats, t],
  );

  const handleEdit = React.useCallback((log: LocalPrayerLog) => {
    router.push(`/edit-prayer/${log.id}`);
  }, []);

  const handleEditPeriod = React.useCallback((period: LocalExemptPeriod) => {
    router.push(`/edit-period/${period.id}`);
  }, []);

  // Merge prayers and periods into a unified timeline sorted by date desc
  type TimelineItem =
    | { type: 'prayer'; data: LocalPrayerLog; sortDate: string }
    | { type: 'period'; data: LocalExemptPeriod; sortDate: string };

  const recentItems: TimelineItem[] = React.useMemo(() => {
    const items: TimelineItem[] = [
      ...logs.map((log) => ({
        type: 'prayer' as const,
        data: log,
        sortDate: log.prayer_date,
      })),
      ...periods.map((p) => ({
        type: 'period' as const,
        data: p,
        sortDate: p.start_date,
      })),
    ];
    items.sort((a, b) => b.sortDate.localeCompare(a.sortDate));
    return items.slice(0, 5);
  }, [logs, periods]);

  return (
    <View style={styles.container}>
      <AnimatedGradientBackground colors={gradientColors} />

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
            contentFit="cover"
            cachePolicy="memory-disk"
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
                <MaterialIcons
                  name="local-fire-department"
                  size={32}
                  color="#ffffff"
                />
              </View>
              <Text style={styles.dashboardLabel}>
                {t('currentStreak').toUpperCase()}
              </Text>
            </View>

            <View style={styles.dashboardDivider} />

            <View style={styles.dashboardItem}>
              {lastNightTotal > 0 ? (
                <>
                  <Text style={styles.lastEntryNumber}>{lastNightTotal}</Text>
                  <Text style={styles.dashboardLabel}>
                    {t('lastNight').toUpperCase()}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.lastEntryNumber}>—</Text>
                  <Text style={styles.dashboardLabel}>
                    {t('lastNight').toUpperCase()}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>{longestStreak}</Text>
            <Text
              style={styles.quickStatLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t('longestStreak')}
            </Text>
          </View>

          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatNumber}>
              {computedStats.bestNight}
            </Text>
            <Text
              style={styles.quickStatLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t('bestNight')}
            </Text>
          </View>

          <View style={styles.quickStatCard}>
            <Text
              style={[
                styles.quickStatNumber,
                {
                  color: computedStats.averageStatus.color,
                  fontSize: 18,
                  marginTop: 2,
                  marginBottom: 8,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t(
                computedStats.averageStatus.status
                  .toLowerCase()
                  .replace(' ', ''),
              )}
            </Text>
            <Text
              style={styles.quickStatLabel}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {t('averageStatus')}
            </Text>
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
            {recentItems.map((item, index) => {
              if (item.type === 'period') {
                const period = item.data;
                const startDate = new Date(period.start_date + 'T00:00:00');
                const endDate = new Date(period.end_date + 'T00:00:00');
                const dateLabel = `${startDate.toLocaleDateString(
                  isRTL ? 'ar-SA' : 'en-US',
                  { month: 'short', day: 'numeric' },
                )} — ${endDate.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                })}`;

                return (
                  <TouchableOpacity
                    key={`period-${period.id}`}
                    style={[
                      styles.historyItem,
                      index === recentItems.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                    onPress={() => handleEditPeriod(period)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.historyIconContainer,
                        { backgroundColor: 'rgba(244,114,182,0.15)' },
                      ]}
                    >
                      <Feather name="calendar" size={20} color="#f472b6" />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={styles.historyRange}>{t('periodDays')}</Text>
                      <Text style={styles.historyVerses}>{dateLabel}</Text>
                    </View>
                    <Feather
                      name={isRTL ? 'chevron-left' : 'chevron-right'}
                      size={16}
                      color="rgba(255,255,255,0.3)"
                    />
                  </TouchableOpacity>
                );
              }

              const log = item.data;
              const dateObj = new Date(log.prayer_date);
              const dateStr = dateObj.toDateString();
              const showDate =
                index === 0 ||
                (recentItems[index - 1].type === 'prayer'
                  ? dateStr !==
                    new Date(
                      (recentItems[index - 1].data as LocalPrayerLog)
                        .prayer_date,
                    ).toDateString()
                  : true);

              const dailyTotal = logs
                .filter(
                  (l) => new Date(l.prayer_date).toDateString() === dateStr,
                )
                .reduce(
                  (sum, l) => sum + calculateTotalAyahs(l.recitations),
                  0,
                );

              const dailyStatus = getVerseStatus(dailyTotal);
              const logTotalAyahs = calculateTotalAyahs(log.recitations);

              const dateLabel = dateObj.toLocaleDateString(
                isRTL ? 'ar-SA' : 'en-US',
                { weekday: 'long', month: 'short', day: 'numeric' },
              );

              return (
                <React.Fragment key={log.id}>
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
                      index === recentItems.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                    onPress={() => handleEdit(log)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.historyIconContainer,
                        { backgroundColor: 'rgba(255,255,255,0.1)' },
                      ]}
                    >
                      <Feather
                        name="moon"
                        size={20}
                        color="rgba(255,255,255,0.6)"
                      />
                    </View>
                    <View style={styles.historyContent}>
                      <Text style={styles.historyRange}>
                        {formatRecitationRange(log)}
                      </Text>
                      <View style={styles.metaContainer}>
                        <Text style={styles.historyVerses}>
                          {logTotalAyahs} {t('verses')}
                        </Text>
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
            {recentItems.length === 0 && (
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


const createStyles = (isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    scrollView: {
      flex: 1,
      marginTop: 20,
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
      width: 160,
      height: 160,
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
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.5)',
      marginTop: 8,
      letterSpacing: 1,
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
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 20,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      justifyContent: 'center',
      minHeight: 110,
    },
    quickStatNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 4,
      textAlign: 'center',
    },
    quickStatLabel: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.5)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      textAlign: 'center',
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

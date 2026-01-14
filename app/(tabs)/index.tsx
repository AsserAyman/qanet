import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useI18n } from '../../contexts/I18nContext';
import {
  useOfflineStats,
  usePrayerLogs,
} from '../../hooks/useOfflineData';
import { getGradientColors } from '../../utils/quranData';

export default function NightPrayerScreen() {
  const { t, isRTL } = useI18n();
  const { logs } = usePrayerLogs();
  const { streak, yearlyData } = useOfflineStats();

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
  });

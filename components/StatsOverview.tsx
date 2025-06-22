import { Feather, MaterialIcons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface StatsOverviewProps {
  streak: number;
  totalNights: number;
  data: { [key: string]: number };
  stats: { status: string; count: number }[];
}

export function StatsOverview({
  streak,
  totalNights,
  data,
  stats,
}: StatsOverviewProps) {
  const { theme } = useTheme();

  // Calculate average verses per night (last 7 days)
  const last7Days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const dateKey = format(date, 'yyyy-MM-dd');
    last7Days.push(data[dateKey] || 0);
  }

  const totalLast7Days = last7Days.reduce((sum, val) => sum + val, 0);
  const averagePerNight = Math.round(totalLast7Days / 7);
  const changePercent =
    last7Days.length >= 2
      ? Math.round(
          ((last7Days[6] - last7Days[0]) / Math.max(last7Days[0], 1)) * 100
        )
      : 0;

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tracker Overview</Text>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <MaterialIcons
              name="local-fire-department"
              size={24}
              color="#ef4444"
            />
          </View>
          <Text style={styles.metricTitle}>Current Streak</Text>
          <Text style={styles.metricValue}>{streak}</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <Feather name="moon" size={24} color="#3b82f6" />
          </View>
          <Text style={styles.metricTitle}>Total Nights</Text>
          <Text style={styles.metricValue}>{totalNights}</Text>
        </View>
      </View>

      <View style={styles.largeMetricCard}>
        <View style={styles.largeMetricHeader}>
          <Text style={styles.largeMetricTitle}>Verses Recited Per Night</Text>
          <View style={styles.changeContainer}>
            <Text style={styles.changeLabel}>Last 7 Nights</Text>
            <Text
              style={[
                styles.changeText,
                { color: changePercent >= 0 ? '#22c55e' : '#ef4444' },
              ]}
            >
              {changePercent >= 0 ? '+' : ''}
              {changePercent}%
            </Text>
          </View>
        </View>

        <Text style={styles.largeMetricValue}>{averagePerNight}</Text>

        {/* Mini line chart */}
        <View style={styles.miniChart}>
          {last7Days.map((value, index) => {
            const maxValue = Math.max(...last7Days, 1);
            const height = (value / maxValue) * 40;
            return (
              <View key={index} style={styles.miniBarContainer}>
                <View
                  style={[
                    styles.miniBar,
                    {
                      height: height || 2,
                      backgroundColor:
                        index === last7Days.length - 1
                          ? '#3b82f6'
                          : theme.border,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.miniChartLabels}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
            (day, index) => (
              <Text key={day} style={styles.miniChartLabel}>
                {day}
              </Text>
            )
          )}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 20,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 16,
    },
    metricCard: {
      flex: 1,
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    metricHeader: {
      marginBottom: 16,
    },
    metricTitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    metricValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text,
    },
    largeMetricCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    largeMetricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    largeMetricTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
    },
    changeContainer: {
      alignItems: 'flex-end',
    },
    changeLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    changeText: {
      fontSize: 14,
      fontWeight: '600',
    },
    largeMetricValue: {
      fontSize: 48,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 20,
    },
    miniChart: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 50,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    miniBarContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    miniBar: {
      width: 3,
      borderRadius: 1.5,
      minHeight: 2,
    },
    miniChartLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    miniChartLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      flex: 1,
    },
  });

import { endOfWeek, format, startOfWeek, subDays } from 'date-fns';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface WeeklyTrendsChartProps {
  data: { [key: string]: number }; // date string -> verse count
}

export function WeeklyTrendsChart({ data }: WeeklyTrendsChartProps) {
  const { theme } = useTheme();
  const { width } = Dimensions.get('window');

  // Get last 7 weeks of data
  const weeks = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const weekStart = startOfWeek(subDays(today, i * 7));
    const weekEnd = endOfWeek(weekStart);

    let weekTotal = 0;
    for (
      let d = new Date(weekStart);
      d <= weekEnd;
      d.setDate(d.getDate() + 1)
    ) {
      const dateKey = format(d, 'yyyy-MM-dd');
      weekTotal += data[dateKey] || 0;
    }

    weeks.push({
      label: format(weekStart, 'MMM d'),
      value: weekTotal,
      isCurrentWeek: i === 0,
    });
  }

  const maxValue = Math.max(...weeks.map((w) => w.value), 1);
  const currentWeekValue = weeks[weeks.length - 1]?.value || 0;
  const lastWeekValue = weeks[weeks.length - 2]?.value || 0;
  const changePercent =
    lastWeekValue > 0
      ? Math.round(((currentWeekValue - lastWeekValue) / lastWeekValue) * 100)
      : 0;

  const barWidth = (width - 120) / 7;
  const maxBarHeight = 120;

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Trends</Text>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Verses (7d)</Text>
          <Text style={styles.totalValue}>{currentWeekValue}</Text>
          <Text
            style={[
              styles.changeText,
              { color: changePercent >= 0 ? '#22c55e' : '#ef4444' },
            ]}
          >
            {changePercent >= 0 ? '+' : ''}
            {changePercent}% ↗
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.barsContainer}>
          {weeks.map((week, index) => {
            const barHeight = (week.value / maxValue) * maxBarHeight;
            return (
              <View key={index} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      width: barWidth - 8,
                      backgroundColor: week.isCurrentWeek
                        ? '#3b82f6'
                        : '#e2e8f0',
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{week.label}</Text>
                <Text style={styles.barValue}>{week.value}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.daysContainer}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
          <Text key={day} style={styles.dayLabel}>
            {day}
          </Text>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 16,
    },
    totalContainer: {
      alignItems: 'flex-start',
    },
    totalLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    totalValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    changeText: {
      fontSize: 14,
      fontWeight: '600',
    },
    chartContainer: {
      marginBottom: 16,
    },
    barsContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 140,
      paddingHorizontal: 4,
    },
    barWrapper: {
      alignItems: 'center',
    },
    bar: {
      borderRadius: 4,
      marginBottom: 8,
    },
    barLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    barValue: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
    },
    daysContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 12,
    },
    dayLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
    },
  });

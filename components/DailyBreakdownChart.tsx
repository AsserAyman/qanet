import { format, subDays } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Stop,
  Svg,
} from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

interface DailyBreakdownChartProps {
  data: { [key: string]: number }; // date string -> verse count
}

interface DayData {
  date: string;
  label: string;
  timeLabel: string;
  value: number;
  isToday: boolean;
}

export function DailyBreakdownChart({ data }: DailyBreakdownChartProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { width } = Dimensions.get('window');
  const locale = isRTL ? arSA : enUS;

  // Get last 7 days of data
  const days: DayData[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const dateKey = format(date, 'yyyy-MM-dd');
    days.push({
      date: dateKey,
      label: format(date, 'EEE', { locale }),
      timeLabel: format(date, 'MMM d', { locale }),
      value: data[dateKey] || 0,
      isToday: i === 0,
    });
  }

  const maxValue = Math.max(...days.map((d) => d.value), 1);
  const todayValue = days[days.length - 1]?.value || 0;
  const yesterdayValue = days[days.length - 2]?.value || 0;
  const changePercent =
    yesterdayValue > 0
      ? Math.round(((todayValue - yesterdayValue) / yesterdayValue) * 100)
      : 0;

  const chartWidth = width - 80;
  const chartHeight = 120;
  const padding = 20;

  // Create path for the line chart
  const createPath = () => {
    if (days.length === 0) return '';

    const stepX = (chartWidth - padding * 2) / (days.length - 1);
    const scaleY = (chartHeight - padding * 2) / maxValue;

    let path = '';

    days.forEach((day, index) => {
      const x = padding + index * stepX;
      const y = chartHeight - padding - day.value * scaleY;

      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        // Create smooth curve using quadratic bezier
        const prevX = padding + (index - 1) * stepX;
        const cpX = (prevX + x) / 2;
        const prevY = chartHeight - padding - days[index - 1].value * scaleY;
        path += ` Q ${cpX} ${prevY} ${x} ${y}`;
      }
    });

    return path;
  };

  const createAreaPath = () => {
    const linePath = createPath();
    if (!linePath) return '';

    const stepX = (chartWidth - padding * 2) / (days.length - 1);
    const baseY = chartHeight - padding;
    const endX = padding + (days.length - 1) * stepX;

    return `${linePath} L ${endX} ${baseY} L ${padding} ${baseY} Z`;
  };

  const styles = createStyles(theme, isRTL);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('dailyBreakdown')}</Text>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>{t('versesRecited')}</Text>
          <Text style={styles.totalValue}>{todayValue}</Text>
          <Text style={styles.periodLabel}>{t('today')}</Text>
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
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          <G>
            {/* Area under the curve */}
            <Path d={createAreaPath()} fill="url(#gradient)" />

            {/* Main line */}
            <Path
              d={createPath()}
              stroke="#3b82f6"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {days.map((day, index) => {
              const stepX = (chartWidth - padding * 2) / (days.length - 1);
              const scaleY = (chartHeight - padding * 2) / maxValue;
              const x = padding + index * stepX;
              const y = chartHeight - padding - day.value * scaleY;

              return (
                <Circle
                  key={index}
                  cx={x}
                  cy={y}
                  r={day.isToday ? 6 : 4}
                  fill={day.isToday ? '#3b82f6' : '#ffffff'}
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              );
            })}
          </G>
        </Svg>
      </View>

      <View style={styles.timeLabels}>
        {['6AM', '12PM', '4PM', '8PM'].map((time, index) => (
          <Text key={time} style={styles.timeLabel}>
            {time}
          </Text>
        ))}
      </View>
    </View>
  );
}

const createStyles = (theme: any, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    header: {
      marginBottom: 24,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 16,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    totalContainer: {
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    totalLabel: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    totalValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 4,
    },
    periodLabel: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    changeText: {
      fontSize: 14,
      fontWeight: '600',
      textAlign: isRTL ? 'right' : 'left',
    },
    chartContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    timeLabels: {
      flexDirection: 'row', // Keep row to match LTR chart
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 12,
    },
    timeLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.6)',
    },
  });

import {
  addMonths,
  differenceInDays,
  differenceInWeeks,
  endOfYear,
  format,
  isSameYear,
  startOfYear,
} from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import React from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';

interface YearlyGraphProps {
  data: { [key: string]: { verses: number; status: string } }; // date string -> { verses, status }
}

export function YearlyGraph({ data }: YearlyGraphProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();
  const { width } = Dimensions.get('window');
  const locale = isRTL ? arSA : enUS;

  // Calculate available width considering padding and gaps
  const containerPadding = 48; // 24px * 2
  const availableWidth = width - containerPadding;
  const gapWidth = 4 * 52; // 4px gap * ~52 weeks
  const cellSize = Math.max((availableWidth - gapWidth) / 53, 5); // Allow smaller size to fit

  // Generate proper date-based grid for the entire current year
  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = endOfYear(today); // Cover the full year

  // Calculate weeks for the full year
  const totalDays = differenceInDays(yearEnd, yearStart) + 1;
  const weeks = Math.ceil(totalDays / 7);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Muqantar':
        return '#a855f7';
      case 'Qanet':
        return '#22c55e';
      case 'Not Negligent':
        return '#3b82f6';
      default:
        return '#ef4444';
    }
  };

  const getColor = (status: string, verses: number) => {
    if (verses === 0) return theme.border + '30';
    return getStatusColor(status);
  };

  const renderGrid = () => {
    const grid = [];

    for (let week = 0; week < weeks; week++) {
      const weekColumn = [];

      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(yearStart);
        currentDate.setDate(yearStart.getDate() + week * 7 + day);

        if (!isSameYear(currentDate, yearStart)) break;

        const dateKey = format(currentDate, 'yyyy-MM-dd');
        const dayData = data[dateKey] || { verses: 0, status: 'Negligent' };

        weekColumn.push(
          <TouchableOpacity
            key={`${week}-${day}`}
            style={[
              styles.cell,
              {
                width: cellSize,
                height: cellSize,
                backgroundColor: getColor(dayData.status, dayData.verses),
              },
            ]}
            activeOpacity={0.7}
          />,
        );
      }

      grid.push(
        <View key={week} style={styles.week}>
          {weekColumn}
        </View>,
      );
    }

    return grid;
  };

  const monthLabels = [];
  for (let i = 0; i < 12; i++) {
    const date = addMonths(yearStart, i);
    const weekIndex = differenceInWeeks(date, yearStart);
    const position = weekIndex * (cellSize + 4);

    monthLabels.push({
      label: format(date, 'MMM', { locale }),
      left: position,
    });
  }

  const styles = createStyles(theme, cellSize, isRTL);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('prayerActivity')}</Text>
        <Text style={styles.subtitle}>
          {t('versesThisYear').replace(
            'verses',
            Object.values(data)
              .reduce((sum, dayData) => sum + dayData.verses, 0)
              .toString(),
          )}
        </Text>
      </View>

      <View style={styles.graphContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={isRTL ? { flexDirection: 'row-reverse' } : {}}
        >
          <View>
            <View style={styles.monthLabels}>
              {monthLabels.map((month, index) => {
                const positionStyle = isRTL
                  ? { right: month.left }
                  : { left: month.left };

                return (
                  <Text key={index} style={[styles.monthLabel, positionStyle]}>
                    {month.label}
                  </Text>
                );
              })}
            </View>
            <View style={styles.graph}>{renderGrid()}</View>
          </View>
        </ScrollView>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>{t('less')}</Text>
        <View style={styles.legendItems}>
          <View
            style={[
              styles.legendItem,
              { backgroundColor: theme.border + '30' },
            ]}
          />
          <View
            style={[
              styles.legendItem,
              { backgroundColor: getStatusColor('Not Negligent') },
            ]}
          />
          <View
            style={[
              styles.legendItem,
              { backgroundColor: getStatusColor('Qanet') },
            ]}
          />
          <View
            style={[
              styles.legendItem,
              { backgroundColor: getStatusColor('Muqantar') },
            ]}
          />
        </View>
        <Text style={styles.legendText}>{t('more')}</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: any, cellSize: number, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 16,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    header: {
      marginBottom: 24,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 4,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    subtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    graphContainer: {
      marginBottom: 16,
    },
    monthLabels: {
      height: 20,
      marginBottom: 8,
      position: 'relative',
    },
    monthLabel: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.6)',
      position: 'absolute',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    graph: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 4,
    },
    week: {
      gap: 4,
    },
    cell: {
      borderRadius: 2,
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    legendItems: {
      flexDirection: 'row',
      gap: 4,
    },
    legendItem: {
      width: 12,
      height: 12,
      borderRadius: 2,
    },
    legendText: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.6)',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
  });

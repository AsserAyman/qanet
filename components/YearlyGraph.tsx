import { differenceInDays, format, startOfYear, addMonths } from 'date-fns';
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
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

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
  const dayLabelsWidth = 20;
  const availableWidth = width - containerPadding - dayLabelsWidth;
  const gapWidth = 4 * 52; // 4px gap * ~52 weeks
  const cellSize = Math.max((availableWidth - gapWidth) / 53, 10); // Smaller minimum size

  // Generate proper date-based grid
  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = today;

  // Calculate weeks from start of year
  const totalDays = differenceInDays(yearEnd, yearStart) + 1;
  const weeks = Math.ceil(totalDays / 7);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Mokantar':
        return '#15803d';
      case 'Qanet':
        return '#2563eb';
      case 'Not Negligent':
        return '#ca8a04';
      default:
        return '#dc2626';
    }
  };

  const getColor = (status: string, verses: number) => {
    if (verses === 0) return theme.border + '30'; // No activity
    return getStatusColor(status); // Single solid color per status
  };

  const getBorderColor = (status: string, verses: number) => {
    if (verses === 0) return theme.border;
    return getStatusColor(status); // Same color for border
  };

  const renderGrid = () => {
    const grid = [];

    for (let week = 0; week < weeks; week++) {
      const weekColumn = [];

      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(yearStart);
        currentDate.setDate(yearStart.getDate() + week * 7 + day);

        if (currentDate > today) break;

        const dateKey = format(currentDate, 'yyyy-MM-dd');
        const dayData = data[dateKey] || { verses: 0, status: 'Negligent' };

        weekColumn.push(
          <TouchableOpacity
            key={`${week}-${day}`}
            style={[
              styles.cell,
              {
                width: cellSize - 2,
                height: cellSize - 2,
                backgroundColor: getColor(dayData.status, dayData.verses),
                borderColor: getBorderColor(dayData.status, dayData.verses),
                borderWidth: dayData.verses > 0 ? 1 : 0,
              },
            ]}
            activeOpacity={0.7}
          />
        );
      }

      grid.push(
        <View key={week} style={styles.week}>
          {weekColumn}
        </View>
      );
    }

    return grid;
  };

  // Generate month labels
  const monthLabels = [];
  for (let i = 0; i < 12; i++) {
    const date = addMonths(yearStart, i);
    monthLabels.push(format(date, 'MMM', { locale }));
  }
  
  // Day labels
  const dayLabels = isRTL 
    ? ['أ', 'إ', 'ث', 'أ', 'خ', 'ج', 'س'] // Sun-Sat approx
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const styles = createStyles(theme, cellSize, isRTL);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('prayerActivity')}</Text>
        <Text style={styles.subtitle}>
          {t('versesThisYear').replace('verses', Object.values(data).reduce(
            (sum, dayData) => sum + dayData.verses,
            0
          ).toString())}
        </Text>
      </View>

      <View style={styles.graphContainer}>
        <View style={styles.monthLabels}>
          {monthLabels.map((month, index) => {
            // Use container width instead of graph width to prevent overflow
            const containerWidth = availableWidth - 20; // Available width minus some padding
            const monthPosition = (index / 11) * Math.max(containerWidth, 0); // Spread across container width
            
            const positionStyle = isRTL 
              ? { right: monthPosition }
              : { left: monthPosition };

            return (
              <Text
                key={index}
                style={[styles.monthLabel, positionStyle]}
              >
                {month}
              </Text>
            );
          })}
        </View>

        <View style={styles.graphWrapper}>
          <View style={styles.dayLabels}>
            {dayLabels.map((day, index) => (
              <Text
                key={index}
                style={[styles.dayLabel, { height: cellSize - 2 }]}
              >
                {index % 2 === 1 ? day : ''}
              </Text>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={isRTL ? { flexDirection: 'row-reverse' } : {}}>
            <View style={styles.graph}>{renderGrid()}</View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>{t('less')}</Text>
        <View style={styles.legendItems}>
          <View
            style={[
              styles.legendItem,
              {
                backgroundColor: theme.border + '30',
                borderColor: theme.border,
                borderWidth: 0,
              },
            ]}
          />
          <View
            style={[
              styles.legendItem,
              {
                backgroundColor: getStatusColor('Not Negligent'),
                borderColor: getStatusColor('Not Negligent'),
                borderWidth: 1,
              },
            ]}
          />
          <View
            style={[
              styles.legendItem,
              {
                backgroundColor: getStatusColor('Qanet'),
                borderColor: getStatusColor('Qanet'),
                borderWidth: 1,
              },
            ]}
          />
          <View
            style={[
              styles.legendItem,
              {
                backgroundColor: getStatusColor('Mokantar'),
                borderColor: getStatusColor('Mokantar'),
                borderWidth: 1,
              },
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
      flexDirection: 'row',
      height: 20,
      marginBottom: 8,
      position: 'relative',
      width: '100%',
    },
    monthLabel: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.6)',
      position: 'absolute',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    graphWrapper: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
    },
    dayLabels: {
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
      justifyContent: 'space-between',
    },
    dayLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
      lineHeight: cellSize - 2,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    graph: {
      flexDirection: isRTL ? 'row-reverse' : 'row', // Reverse grid for RTL
      gap: 4,
    },
    week: {
      gap: 4,
    },
    cell: {
      borderRadius: 4,
    },
    legend: {
      flexDirection: 'row', // Keep LTR for scale
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    legendItems: {
      flexDirection: 'row',
      gap: 4,
    },
    legendItem: {
      width: 16,
      height: 16,
      borderRadius: 3,
    },
    legendText: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.6)',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
  });

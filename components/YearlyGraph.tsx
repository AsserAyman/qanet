import { differenceInDays, format, startOfYear } from 'date-fns';
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

interface YearlyGraphProps {
  data: { [key: string]: { verses: number; status: string } }; // date string -> { verses, status }
}

export function YearlyGraph({ data }: YearlyGraphProps) {
  const { theme } = useTheme();
  const { width } = Dimensions.get('window');

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

  const styles = createStyles(theme, cellSize);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prayer Activity</Text>
        <Text style={styles.subtitle}>
          {Object.values(data).reduce(
            (sum, dayData) => sum + dayData.verses,
            0
          )}{' '}
          verses this year
        </Text>
      </View>

      <View style={styles.graphContainer}>
        <View style={styles.monthLabels}>
          {[
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ].map((month, index) => {
            // Use container width instead of graph width to prevent overflow
            const containerWidth = availableWidth - 20; // Available width minus some padding
            const monthPosition = (index / 11) * Math.max(containerWidth, 0); // Spread across container width
            return (
              <Text
                key={month}
                style={[styles.monthLabel, { left: monthPosition }]}
              >
                {month}
              </Text>
            );
          })}
        </View>

        <View style={styles.graphWrapper}>
          <View style={styles.dayLabels}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Text
                key={index}
                style={[styles.dayLabel, { height: cellSize - 2 }]}
              >
                {index % 2 === 1 ? day : ''}
              </Text>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.graph}>{renderGrid()}</View>
          </ScrollView>
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
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
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const createStyles = (theme: any, cellSize: number) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 24,
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
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    graphContainer: {
      marginBottom: 16,
    },
    monthLabels: {
      flexDirection: 'row',
      height: 20,
      marginBottom: 8,
      position: 'relative',
    },
    monthLabel: {
      fontSize: 10,
      color: theme.textSecondary,
      position: 'absolute',
    },
    graphWrapper: {
      flexDirection: 'row',
    },
    dayLabels: {
      marginRight: 8,
      justifyContent: 'space-between',
    },
    dayLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: cellSize - 2,
    },
    graph: {
      flexDirection: 'row',
      gap: 4,
    },
    week: {
      gap: 4,
    },
    cell: {
      borderRadius: 4,
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
      width: 16,
      height: 16,
      borderRadius: 3,
    },
    legendText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
  });

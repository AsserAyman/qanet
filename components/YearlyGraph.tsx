import { differenceInDays, format, startOfYear } from 'date-fns';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface YearlyGraphProps {
  data: { [key: string]: number }; // date string -> verse count
}

export function YearlyGraph({ data }: YearlyGraphProps) {
  const { theme } = useTheme();
  const { width } = Dimensions.get('window');
  const cellSize = (width - 80) / 53; // 53 weeks max

  // Generate proper date-based grid
  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = today;

  // Calculate weeks from start of year
  const totalDays = differenceInDays(yearEnd, yearStart) + 1;
  const weeks = Math.ceil(totalDays / 7);

  const getIntensity = (value: number) => {
    if (value === 0) return 0;
    if (value <= 10) return 1;
    if (value <= 50) return 2;
    if (value <= 100) return 3;
    return 4;
  };

  const getColor = (intensity: number) => {
    const colors = [
      theme.border + '40', // No activity
      '#22c55e20', // Light green
      '#22c55e40', // Medium green
      '#22c55e80', // Dark green
      '#22c55e', // Full green
    ];
    return colors[intensity];
  };

  const getBorderColor = (intensity: number) => {
    if (intensity === 0) return theme.border;
    const colors = ['', '#22c55e60', '#22c55e80', '#22c55eA0', '#22c55e'];
    return colors[intensity];
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
        const value = data[dateKey] || 0;
        const intensity = getIntensity(value);

        weekColumn.push(
          <TouchableOpacity
            key={`${week}-${day}`}
            style={[
              styles.cell,
              {
                width: cellSize - 2,
                height: cellSize - 2,
                backgroundColor: getColor(intensity),
                borderColor: getBorderColor(intensity),
                borderWidth: intensity > 0 ? 1 : 0,
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
          {Object.values(data).reduce((sum, val) => sum + val, 0)} verses this
          year
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
          ].map((month, index) => (
            <Text
              key={month}
              style={[styles.monthLabel, { left: index * cellSize * 4.3 }]}
            >
              {month}
            </Text>
          ))}
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

          <View style={styles.graph}>{renderGrid()}</View>
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={styles.legendItems}>
          {[0, 1, 2, 3, 4].map((intensity) => (
            <View
              key={intensity}
              style={[
                styles.legendItem,
                {
                  backgroundColor: getColor(intensity),
                  borderColor: getBorderColor(intensity),
                  borderWidth: intensity > 0 ? 1 : 0,
                },
              ]}
            />
          ))}
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
      padding: 20,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      marginBottom: 20,
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
      fontSize: 12,
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
      gap: 3,
    },
    week: {
      gap: 3,
    },
    cell: {
      borderRadius: 3,
    },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    legendItems: {
      flexDirection: 'row',
      gap: 3,
    },
    legendItem: {
      width: 12,
      height: 12,
      borderRadius: 2,
    },
    legendText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
  });

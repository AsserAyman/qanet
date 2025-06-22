import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

interface YearlyGraphProps {
  data: { [key: string]: number }; // date string -> verse count
}

export function YearlyGraph({ data }: YearlyGraphProps) {
  const maxValue = Math.max(...Object.values(data));
  const weeks = 52;
  const days = 7;

  const getColor = (value: number) => {
    if (value >= 1000) return '#15803d';
    if (value >= 100) return '#2563eb';
    if (value >= 10) return '#ca8a04';
    if (value > 0) return '#dc2626';
    return '#f1f5f9';
  };

  const getOpacity = (value: number) => {
    if (value === 0) return 0.1;
    const normalized = Math.min(Math.log10(value) / Math.log10(maxValue), 1);
    return 0.2 + (normalized * 0.8);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yearly Activity</Text>
      <View style={styles.graph}>
        {Array.from({ length: weeks }).map((_, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {Array.from({ length: days }).map((_, dayIndex) => {
              const value = data[`${weekIndex}-${dayIndex}`] || 0;
              return (
                <View
                  key={dayIndex}
                  style={[
                    styles.day,
                    {
                      backgroundColor: getColor(value),
                      opacity: getOpacity(value),
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        {[0, 10, 100, 1000].map((value, index) => (
          <View
            key={index}
            style={[
              styles.legendItem,
              { backgroundColor: getColor(value), opacity: getOpacity(value) },
            ]}
          />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  graph: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  week: {
    gap: 2,
  },
  day: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  legendItem: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
});
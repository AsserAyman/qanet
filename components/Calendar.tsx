import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';

interface CalendarProps {
  date: Date;
  markedDates: { [key: string]: string }; // date string -> status
  onDateChange: (date: Date) => void;
}

export function Calendar({ date, markedDates, onDateChange }: CalendarProps) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = eachDayOfInterval({ start, end });

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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{format(date, 'MMMM yyyy')}</Text>
      <View style={styles.weekDays}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Text key={index} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.dates}>
        {Array.from({ length: start.getDay() }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.emptyDate} />
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const status = markedDates[dateStr];
          const isCurrentMonth = isSameMonth(day, date);
          
          return (
            <TouchableOpacity
              key={day.toString()}
              onPress={() => onDateChange(day)}
              style={[
                styles.date,
                isToday(day) && styles.today,
                !isCurrentMonth && styles.otherMonth,
                status && { backgroundColor: getStatusColor(status) + '20' },
              ]}>
              <Text
                style={[
                  styles.dateText,
                  !isCurrentMonth && styles.otherMonthText,
                  status && { color: getStatusColor(status) },
                ]}>
                {format(day, 'd')}
              </Text>
              {status && <View style={[styles.dot, { backgroundColor: getStatusColor(status) }]} />}
            </TouchableOpacity>
          );
        })}
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
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: '#64748b',
    fontWeight: '500',
  },
  dates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  date: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  emptyDate: {
    width: '14.28%',
    aspectRatio: 1,
  },
  dateText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  today: {
    backgroundColor: '#f1f5f9',
  },
  otherMonth: {
    opacity: 0.5,
  },
  otherMonthText: {
    color: '#94a3b8',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
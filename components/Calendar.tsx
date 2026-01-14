import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../contexts/I18nContext';

interface CalendarProps {
  date: Date;
  markedDates: { [key: string]: string }; // date string -> status
  onDateChange: (date: Date) => void;
}

export function Calendar({ date, markedDates, onDateChange }: CalendarProps) {
  const { theme } = useTheme();
  const { isRTL } = useI18n();
  const locale = isRTL ? arSA : enUS;

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

  const styles = createStyles(theme, isRTL);
  
  // Localized week days
  const weekDays = isRTL 
    ? ['أ', 'إ', 'ث', 'أ', 'خ', 'ج', 'س'] // Sun (Ahad) to Sat (Sabt)
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{format(date, 'MMMM yyyy', { locale })}</Text>
      <View style={styles.weekDays}>
        {weekDays.map((day, index) => (
          <Text key={index} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.dates}>
        {/* Alignment spacer for start of month */}
        {/* For RTL, if we reverse the array, we need to adjust spacers or just let flex-wrap handle it naturally? 
            If direction is row-reverse, the first item is on the right.
            Standard calendar grid:
            Sun Mon Tue Wed Thu Fri Sat
            
            RTL Calendar grid:
            Sat Fri Thu Wed Tue Mon Sun (Reading right to left)
            OR
            Sun Mon Tue Wed Thu Fri Sat (Reading right to left)
            
            Usually Arabic calendars still start with Sunday or Saturday on the Right.
            If we use row-reverse, index 0 (Sunday) will be on the Right.
        */}
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
                {format(day, 'd', { locale })}
              </Text>
              {status && <View style={[styles.dot, { backgroundColor: getStatusColor(status) }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: any, isRTL: boolean) => StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  weekDays: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  dates: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
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
    color: '#ffffff',
    fontWeight: '500',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  today: {
    backgroundColor: theme.primary + '20',
  },
  otherMonth: {
    opacity: 0.5,
  },
  otherMonthText: {
    color: 'rgba(255,255,255,0.4)',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
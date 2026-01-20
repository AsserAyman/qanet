import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
} from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';

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
        return '#a855f7';
      case 'Qanet':
        return '#22c55e';
      case 'Not Negligent':
        return '#3b82f6';
      default:
        return '#ef4444';
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
              style={[styles.date, !isCurrentMonth && styles.otherMonth]}
            >
              <View
                style={[
                  styles.dayContent,
                  status && {
                    backgroundColor: getStatusColor(status) + '20',
                    borderColor: getStatusColor(status) + '40',
                    borderWidth: 1,
                  },
                  isToday(day) && styles.today,
                ]}
              >
                <Text
                  style={[
                    styles.dateText,
                    !isCurrentMonth && styles.otherMonthText,
                    status && {
                      color: getStatusColor(status),
                      fontWeight: '700',
                    },
                    isToday(day) &&
                      !status && {
                        color: 'rgba(255,255,255,0.6)',
                        fontWeight: '700',
                      },
                  ]}
                >
                  {format(day, 'd', { locale })}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (theme: any, isRTL: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 24,
      padding: 16,
      paddingBottom: 12,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    header: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginBottom: 12,
      marginTop: 4,
      textAlign: 'center',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    weekDays: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      marginBottom: 12,
    },
    weekDay: {
      flex: 1,
      textAlign: 'center',
      color: 'rgba(255,255,255,0.4)',
      fontSize: 12,
      fontWeight: '500',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    dates: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      rowGap: 8,
    },
    date: {
      width: '14.28%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyDate: {
      width: '14.28%',
      aspectRatio: 1,
    },
    dayContent: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 18,
    },
    dateText: {
      fontSize: 14,
      color: '#ffffff',
      fontWeight: '500',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    today: {
      borderWidth: 1.5,
      borderColor: '#ffffff',
    },
    otherMonth: {
      opacity: 0.3,
    },
    otherMonthText: {
      color: 'rgba(255,255,255,0.4)',
    },
  });

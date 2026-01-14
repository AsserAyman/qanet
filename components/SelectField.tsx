import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useI18n } from '../contexts/I18nContext';

interface SelectFieldProps {
  label: string;
  value: string;
  onPress: () => void;
  placeholder?: string;
}

export function SelectField({ label, value, onPress, placeholder }: SelectFieldProps) {
  const { isRTL } = useI18n();
  const styles = createStyles(isRTL);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.field}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder || 'Select...'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (isRTL: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    label: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.5)',
      marginBottom: 8,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    field: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    value: {
      fontSize: 15,
      color: '#ffffff',
      fontWeight: '500',
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    placeholder: {
      color: 'rgba(255,255,255,0.4)',
    },
  });

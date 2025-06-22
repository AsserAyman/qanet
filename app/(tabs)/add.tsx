import { Feather, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import {
  calculateVersesBetween,
  getVerseStatus,
  quranData,
} from '../../utils/quranData';
import { savePrayerLog } from '../../utils/supabase';
import { useTheme } from '../../contexts/ThemeContext';

export default function AddPrayerScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState('Al-Baqara');
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [endSurah, setEndSurah] = useState('Al-Baqara');
  const [endAyah, setEndAyah] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading) return;

    if (!session) {
      router.replace('/(auth)/sign-in');
    }
  }, [session, authLoading]);

  const currentSurah = quranData.find((s) => s.name === selectedSurah);
  const endCurrentSurah = quranData.find((s) => s.name === endSurah);

  const totalVerses = calculateVersesBetween(
    selectedSurah,
    selectedAyah,
    endSurah,
    endAyah
  );
  const status = getVerseStatus(totalVerses);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      await savePrayerLog(
        selectedSurah,
        selectedAyah,
        endSurah,
        endAyah,
        totalVerses,
        status.status,
        date
      );

      router.push('/(tabs)/history');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Loading...</Text>
      </View>
    );
  }

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/1850021/pexels-photo-1850021.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Add Prayer Record</Text>
          <Text style={styles.headerSubtitle}>
            Record your night prayer progress
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.dateSection}>
            <MaterialIcons name="calendar-today" size={24} color={theme.textSecondary} />
            <View style={styles.dateContent}>
              <Text style={styles.dateLabel}>Prayer Date</Text>
              {(showDatePicker || Platform.OS !== 'web') && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  onChange={onDateChange}
                  style={styles.datePicker}
                />
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Starting Surah</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedSurah}
                onValueChange={setSelectedSurah}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.textSecondary}
              >
                {quranData.map((surah) => (
                  <Picker.Item
                    key={surah.name}
                    label={surah.name}
                    value={surah.name}
                    color={theme.text}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Starting Ayah</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={String(selectedAyah)}
                onValueChange={(value) => setSelectedAyah(Number(value))}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.textSecondary}
              >
                {Array.from({ length: currentSurah?.ayahs || 0 }, (_, i) => (
                  <Picker.Item
                    key={i + 1}
                    label={String(i + 1)}
                    value={String(i + 1)}
                    color={theme.text}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ending Surah</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={endSurah}
                onValueChange={setEndSurah}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.textSecondary}
              >
                {quranData.map((surah) => (
                  <Picker.Item
                    key={surah.name}
                    label={surah.name}
                    value={surah.name}
                    color={theme.text}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ending Ayah</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={String(endAyah)}
                onValueChange={(value) => setEndAyah(Number(value))}
                style={[styles.picker, { color: theme.text }]}
                dropdownIconColor={theme.textSecondary}
              >
                {Array.from({ length: endCurrentSurah?.ayahs || 0 }, (_, i) => (
                  <Picker.Item
                    key={i + 1}
                    label={String(i + 1)}
                    value={String(i + 1)}
                    color={theme.text}
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View
          style={[styles.statusCard, { backgroundColor: status.color + '20' }]}
        >
          <View style={styles.statusHeader}>
            <Feather name="moon" size={24} color={status.color} />
            <Text style={[styles.statusTitle, { color: status.color }]}>
              {status.status}
            </Text>
          </View>
          <Text style={styles.statusDescription}>{status.description}</Text>
          <Text style={[styles.totalVerses, { color: status.color }]}>
            Total verses: {totalVerses}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Prayer Record'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    height: 200,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.overlay,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
  },
  content: {
    flex: 1,
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: theme.background,
    padding: 24,
  },
  errorContainer: {
    backgroundColor: theme.error + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateContent: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 4,
  },
  datePicker: {
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: theme.background,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
  },
  picker: {
    backgroundColor: theme.background,
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  totalVerses: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
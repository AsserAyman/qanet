import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  calculateVerseRange,
  calculateVersesBetween,
  getVerseStatus,
  quranData,
} from '../../utils/quranData';

export default function NightPrayerScreen() {
  const [mode, setMode] = useState<'target' | 'range'>('target');
  const [selectedSurah, setSelectedSurah] = useState('Al-Baqara');
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [targetVerses, setTargetVerses] = useState(100);

  const [endSurah, setEndSurah] = useState('Al-Baqara');
  const [endAyah, setEndAyah] = useState(1);

  const currentSurah = quranData.find((s) => s.name === selectedSurah);
  const endCurrentSurah = quranData.find((s) => s.name === endSurah);

  const range =
    mode === 'target'
      ? calculateVerseRange(selectedSurah, selectedAyah, targetVerses)
      : {
          startSurah: selectedSurah,
          startAyah: selectedAyah,
          endSurah: endSurah,
          endAyah: endAyah,
          totalAyahs: calculateVersesBetween(
            selectedSurah,
            selectedAyah,
            endSurah,
            endAyah
          ),
        };

  const status = getVerseStatus(range.totalAyahs);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Night Prayer Calculator</Text>
          <Text style={styles.headerSubtitle}>
            Calculate your night prayer verses
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'target' && styles.modeButtonActive,
            ]}
            onPress={() => setMode('target')}
          >
            <MaterialIcons
              name="calculate"
              size={20}
              color={mode === 'target' ? '#ffffff' : '#64748b'}
            />
            <Text
              style={[
                styles.modeButtonText,
                mode === 'target' && styles.modeButtonTextActive,
              ]}
            >
              Target Verses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              mode === 'range' && styles.modeButtonActive,
            ]}
            onPress={() => setMode('range')}
          >
            <Feather
              name="arrow-right"
              size={20}
              color={mode === 'range' ? '#ffffff' : '#64748b'}
            />
            <Text
              style={[
                styles.modeButtonText,
                mode === 'range' && styles.modeButtonTextActive,
              ]}
            >
              Custom Range
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Starting Surah</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedSurah}
                onValueChange={setSelectedSurah}
                style={styles.picker}
              >
                {quranData.map((surah) => (
                  <Picker.Item
                    key={surah.name}
                    label={surah.name}
                    value={surah.name}
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
                style={styles.picker}
              >
                {Array.from({ length: currentSurah?.ayahs || 0 }, (_, i) => (
                  <Picker.Item
                    key={i + 1}
                    label={String(i + 1)}
                    value={String(i + 1)}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {mode === 'target' ? (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Verses</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={String(targetVerses)}
                  onValueChange={(value) => setTargetVerses(Number(value))}
                  style={styles.picker}
                >
                  <Picker.Item label="10 verses" value="10" />
                  <Picker.Item label="100 verses" value="100" />
                  <Picker.Item label="1000 verses" value="1000" />
                </Picker>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ending Surah</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={endSurah}
                    onValueChange={setEndSurah}
                    style={styles.picker}
                  >
                    {quranData.map((surah) => (
                      <Picker.Item
                        key={surah.name}
                        label={surah.name}
                        value={surah.name}
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
                    style={styles.picker}
                  >
                    {Array.from(
                      { length: endCurrentSurah?.ayahs || 0 },
                      (_, i) => (
                        <Picker.Item
                          key={i + 1}
                          label={String(i + 1)}
                          value={String(i + 1)}
                        />
                      )
                    )}
                  </Picker>
                </View>
              </View>
            </>
          )}
        </View>

        <View
          style={[styles.statusCard, { backgroundColor: status.color + '10' }]}
        >
          <View style={styles.statusHeader}>
            <Feather name="moon" size={24} color={status.color} />
            <Text style={[styles.statusTitle, { color: status.color }]}>
              {status.status}
            </Text>
          </View>
          <Text style={styles.statusDescription}>{status.description}</Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Reading Range</Text>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Start</Text>
            <Text style={styles.resultValue}>
              {range.startSurah} - Ayah {range.startAyah}
            </Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>End</Text>
            <Text style={styles.resultValue}>
              {range.endSurah} - Ayah {range.endAyah}
            </Text>
          </View>
          <View style={styles.totalVerses}>
            <Text style={styles.totalVersesLabel}>Total verses</Text>
            <Text style={styles.totalVersesValue}>{range.totalAyahs}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
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
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: '#2563eb',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: '#f8fafc',
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
    color: '#64748b',
    lineHeight: 24,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  resultItem: {
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  totalVerses: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalVersesLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  totalVersesValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
});

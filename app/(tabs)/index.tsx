import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import {
  calculateVerseRange,
  calculateVersesBetween,
  getVerseStatus,
  quranData,
} from '../../utils/quranData';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';

const { width } = Dimensions.get('window');

export default function NightPrayerScreen() {
  const [mode, setMode] = useState<'target' | 'range'>('target');
  const [selectedSurah, setSelectedSurah] = useState('Al-Baqara');
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [targetVerses, setTargetVerses] = useState(10);

  const [endSurah, setEndSurah] = useState('Al-Baqara');
  const [endAyah, setEndAyah] = useState(1);

  const { t, isRTL } = useI18n();

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

  // Force dark theme styles for this specific design
  const styles = createStyles(isRTL);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4a0e0e', '#2b0505', '#000000']}
        style={styles.background}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Qanet</Text>
          <Text style={styles.headerSubtitle}>
            {t('calculateYourNightPrayerVerses')}
          </Text>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Image
              source={require('../../assets/images/moon-image.png')}
              style={styles.moonImage}
            />
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {t(status.status.toLowerCase().replace(/\s+/g, ''))}
              </Text>
              <Text style={styles.statusDescription}>
                {status.description}
              </Text>
            </View>
          </View>
          
          <View style={styles.totalVersesContainer}>
            <Text style={styles.totalVersesNumber}>{range.totalAyahs}</Text>
            <Text style={styles.totalVersesLabel}>{t('totalVerses')}</Text>
          </View>
        </View>

        {/* Range Display */}
        <View style={styles.rangeDisplayCard}>
          <View style={styles.rangeRow}>
            <View style={styles.rangeItem}>
              <Text style={styles.rangeSurah}>{range.startSurah}</Text>
              <Text style={styles.rangeAyah}>{t('ayah')} {range.startAyah}</Text>
            </View>
            <Feather name={isRTL ? "arrow-left" : "arrow-right"} size={20} color="#ffffff" style={{ opacity: 0.5 }} />
            <View style={styles.rangeItem}>
              <Text style={styles.rangeSurah}>{range.endSurah}</Text>
              <Text style={styles.rangeAyah}>{t('ayah')} {range.endAyah}</Text>
            </View>
          </View>
        </View>

        {/* Controls Container */}
        <View style={styles.controlsContainer}>
          {/* Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                mode === 'target' && styles.toggleButtonActive,
              ]}
              onPress={() => setMode('target')}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'target' && styles.toggleTextActive,
                ]}
              >
                {t('targetVerses')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                mode === 'range' && styles.toggleButtonActive,
              ]}
              onPress={() => setMode('range')}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === 'range' && styles.toggleTextActive,
                ]}
              >
                {t('customRange')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          {mode === 'target' && (
            <View style={styles.targetOptions}>
              <Text style={styles.sectionLabel}>{t('targetVerses')}</Text>
              <View style={styles.targetButtonsRow}>
                {[10, 100, 1000].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.targetButton,
                      targetVerses === val && styles.targetButtonActive,
                    ]}
                    onPress={() => setTargetVerses(val)}
                  >
                    <Text
                      style={[
                        styles.targetButtonText,
                        targetVerses === val && styles.targetButtonTextActive,
                      ]}
                    >
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.pickersSection}>
            <Text style={styles.sectionLabel}>
              {mode === 'target' ? t('startingPoint') : t('readingRange')}
            </Text>
            
            {/* Start Picker */}
            <View style={styles.pickerRow}>
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>{t('startingSurah')}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedSurah}
                    onValueChange={setSelectedSurah}
                    style={styles.picker}
                    dropdownIconColor="#ffffff"
                    itemStyle={{ color: '#ffffff' }}
                  >
                    {quranData.map((surah) => (
                      <Picker.Item
                        key={surah.name}
                        label={surah.name}
                        value={surah.name}
                        color={Platform.OS === 'android' ? '#000000' : '#ffffff'}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>{t('ayah')}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={String(selectedAyah)}
                    onValueChange={(value) => setSelectedAyah(Number(value))}
                    style={styles.picker}
                    dropdownIconColor="#ffffff"
                    itemStyle={{ color: '#ffffff' }}
                  >
                    {Array.from({ length: currentSurah?.ayahs || 0 }, (_, i) => (
                      <Picker.Item
                        key={i + 1}
                        label={String(i + 1)}
                        value={String(i + 1)}
                        color={Platform.OS === 'android' ? '#000000' : '#ffffff'}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* End Picker (Range Mode Only) */}
            {mode === 'range' && (
              <View style={[styles.pickerRow, { marginTop: 16 }]}>
                <View style={styles.pickerWrapper}>
                  <Text style={styles.pickerLabel}>{t('endingSurah')}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={endSurah}
                      onValueChange={setEndSurah}
                      style={styles.picker}
                      dropdownIconColor="#ffffff"
                      itemStyle={{ color: '#ffffff' }}
                    >
                      {quranData.map((surah) => (
                        <Picker.Item
                          key={surah.name}
                          label={surah.name}
                          value={surah.name}
                          color={Platform.OS === 'android' ? '#000000' : '#ffffff'}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.pickerWrapper}>
                  <Text style={styles.pickerLabel}>{t('ayah')}</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={String(endAyah)}
                      onValueChange={(value) => setEndAyah(Number(value))}
                      style={styles.picker}
                      dropdownIconColor="#ffffff"
                      itemStyle={{ color: '#ffffff' }}
                    >
                      {Array.from(
                        { length: endCurrentSurah?.ayahs || 0 },
                        (_, i) => (
                          <Picker.Item
                            key={i + 1}
                            label={String(i + 1)}
                            value={String(i + 1)}
                            color={Platform.OS === 'android' ? '#000000' : '#ffffff'}
                          />
                        )
                      )}
                    </Picker>
                  </View>
                </View>
              </View>
            )}
          </View>

        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (isRTL: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
    alignItems: isRTL ? 'flex-end' : 'flex-start',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  moonImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  statusDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  totalVersesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  totalVersesNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 56,
  },
  totalVersesLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  rangeDisplayCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  rangeRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeItem: {
    alignItems: isRTL ? 'flex-end' : 'flex-start',
    flex: 1,
  },
  rangeSurah: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  rangeAyah: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  controlsContainer: {
    backgroundColor: '#0f0f0f',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  toggleButtonActive: {
    backgroundColor: '#ffffff',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  toggleTextActive: {
    color: '#000000',
  },
  targetOptions: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 12,
    marginLeft: 4,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  targetButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  targetButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  targetButtonActive: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  targetButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  targetButtonTextActive: {
    fontWeight: '700',
  },
  pickersSection: {
    gap: 16,
  },
  pickerRow: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    gap: 12,
  },
  pickerWrapper: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 6,
    marginLeft: 4,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    overflow: 'hidden', // Crucial for iOS rounded corners
  },
  picker: {
    color: '#ffffff',
    height: Platform.OS === 'android' ? 50 : undefined,
  },
});
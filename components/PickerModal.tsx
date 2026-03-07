import { Ionicons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react';
import {
  FlatList,
  Modal,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../contexts/I18nContext';

export interface PickerOption {
  label: string;
  value: string;
  searchTerms?: string;
  subtitle?: string;
  badge?: string | number;
}

export interface PickerSection {
  title: string;
  data: PickerOption[];
}

interface PickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  options?: PickerOption[];
  sections?: PickerSection[];
  selectedValue: string;
  title: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

export function PickerModal({
  visible,
  onClose,
  onSelect,
  options = [],
  sections,
  selectedValue,
  title,
  showSearch = true,
  searchPlaceholder = 'Search...',
}: PickerModalProps) {
  const { isRTL, t } = useI18n();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const styles = createStyles(isRTL);

  const totalCount = sections
    ? sections.reduce((acc, s) => acc + s.data.length, 0)
    : options.length;

  // Flat filtered options (used when sections not provided or search is active)
  const filteredOptions = useMemo(() => {
    if (sections) return []; // Not used in section mode without search
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(query) ||
        o.value.toLowerCase().includes(query) ||
        o.searchTerms?.toLowerCase().includes(query),
    );
  }, [options, sections, searchQuery]);

  // Filtered sections (used when sections provided)
  const filteredSections = useMemo(() => {
    if (!sections) return undefined;
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        data: section.data.filter(
          (o) =>
            o.label.toLowerCase().includes(query) ||
            o.value.toLowerCase().includes(query) ||
            o.searchTerms?.toLowerCase().includes(query),
        ),
      }))
      .filter((s) => s.data.length > 0);
  }, [sections, searchQuery]);

  const handleSelect = (value: string) => {
    onSelect(value);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const renderItem = ({ item }: { item: PickerOption }) => {
    const isSelected = item.value === selectedValue;
    const isRich = item.subtitle != null || item.badge != null;
    return (
      <TouchableOpacity
        style={[
          styles.option,
          isRich && styles.optionRich,
          isSelected && styles.optionSelected,
        ]}
        onPress={() => handleSelect(item.value)}
        activeOpacity={0.7}
      >
        <View style={styles.optionContent}>
          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
            {item.label}
          </Text>
          {item.subtitle && (
            <Text style={[styles.optionSubtitle, isSelected && styles.optionSubtitleSelected]}>
              {item.subtitle}
            </Text>
          )}
        </View>
        {item.badge != null ? (
          <View style={[styles.badge, isSelected && styles.badgeSelected]}>
            <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
              {item.badge}
            </Text>
          </View>
        ) : isSelected ? (
          <Ionicons name="checkmark" size={20} color="#ffffff" />
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: PickerSection }) => {
    const isFirst = (filteredSections ?? sections)?.[0]?.title === section.title;
    return (
      <View style={[styles.sectionHeader, !isFirst && styles.sectionHeaderDivider]}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          {showSearch && totalCount > 10 && (
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={18}
                color="rgba(255,255,255,0.5)"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Sectioned List */}
          {filteredSections ? (
            <SectionList
              sections={filteredSections}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={(item) => item.value}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              initialNumToRender={30}
              stickySectionHeadersEnabled={false}
              keyboardShouldPersistTaps="handled"
              onScrollToIndexFailed={() => {}}
            />
          ) : (
            <FlatList
              data={filteredOptions}
              renderItem={renderItem}
              keyExtractor={(item) => item.value}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              initialNumToRender={20}
              keyboardShouldPersistTaps="handled"
              getItemLayout={(_, index) => ({
                length: 52,
                offset: 52 * index,
                index,
              })}
              initialScrollIndex={
                filteredOptions.findIndex((o) => o.value === selectedValue) > 5
                  ? filteredOptions.findIndex((o) => o.value === selectedValue) - 2
                  : 0
              }
              onScrollToIndexFailed={() => {}}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (isRTL: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.6)',
    },
    container: {
      backgroundColor: '#1a1a1a',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
      minHeight: 300,
    },
    handleContainer: {
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 8,
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 2,
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    closeButton: {
      padding: 4,
    },
    searchContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginHorizontal: 20,
      marginBottom: 16,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    searchIcon: {
      marginRight: isRTL ? 0 : 8,
      marginLeft: isRTL ? 8 : 0,
    },
    searchInput: {
      flex: 1,
      color: '#ffffff',
      fontSize: 15,
      paddingVertical: 12,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    list: {
      paddingHorizontal: 12,
    },
    sectionHeader: {
      paddingHorizontal: 8,
      paddingTop: 16,
      paddingBottom: 6,
    },
    sectionHeaderDivider: {
      marginTop: 8,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.07)',
    },
    sectionHeaderText: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.4)',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    option: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 4,
    },
    optionRich: {
      paddingVertical: 14,
    },
    optionSelected: {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    optionContent: {
      flex: 1,
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    optionText: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.8)',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    optionTextSelected: {
      color: '#ffffff',
      fontWeight: '600',
    },
    optionSubtitle: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.35)',
      marginTop: 2,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    optionSubtitleSelected: {
      color: 'rgba(255,255,255,0.55)',
    },
    badge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(255,255,255,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeSelected: {
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.4)',
    },
    badgeTextSelected: {
      color: '#ffffff',
    },
  });

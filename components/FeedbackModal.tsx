import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../contexts/I18nContext';
import { networkManager } from '../utils/network/networkManager';
import { submitFeedback } from '../utils/supabase';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FeedbackModal({
  visible,
  onClose,
  onSuccess,
}: FeedbackModalProps) {
  const { isRTL, t } = useI18n();
  const insets = useSafeAreaInsets();
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const styles = createStyles(isRTL);

  const trimmedText = feedbackText.trim();
  const charCount = trimmedText.length;
  const isValid = charCount >= 1 && charCount <= 5000;
  const isApproachingLimit = charCount > 4500;

  const handleClose = () => {
    if (!isSubmitting) {
      setFeedbackText('');
      setError('');
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    // Clear previous errors
    setError('');

    // Check network connectivity
    if (!networkManager.isOnline()) {
      setError(t('feedbackRequiresInternet'));
      return;
    }

    setIsSubmitting(true);

    try {
      await submitFeedback(trimmedText);
      setFeedbackText('');
      setError('');
      onSuccess();
    } catch (err) {
      console.error('Feedback error:', err);
      setError(t('feedbackSubmitError'));
    } finally {
      setIsSubmitting(false);
    }
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
            <Text style={styles.title}>{t('sendFeedback')}</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isSubmitting}
            >
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Feedback Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={t('feedbackPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={feedbackText}
              onChangeText={setFeedbackText}
              multiline
              numberOfLines={6}
              maxLength={5000}
              textAlignVertical="top"
              editable={!isSubmitting}
              autoFocus
            />
          </View>

          {/* Character Counter */}
          <View style={styles.counterContainer}>
            <Text
              style={[
                styles.counterText,
                isApproachingLimit && styles.counterTextWarning,
                !isValid && charCount > 0 && styles.counterTextError,
              ]}
            >
              {t('charactersRemaining', { count: charCount })}
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isValid || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
            activeOpacity={0.7}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {t('feedbackSubmit')}
              </Text>
            )}
          </TouchableOpacity>
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
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    handleContainer: {
      alignItems: 'center',
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
    inputContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      padding: 16,
      marginBottom: 12,
    },
    textInput: {
      color: '#ffffff',
      fontSize: 16,
      minHeight: 120,
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    counterContainer: {
      alignItems: isRTL ? 'flex-start' : 'flex-end',
      marginBottom: 16,
    },
    counterText: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.5)',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    counterTextWarning: {
      color: '#f59e0b',
    },
    counterTextError: {
      color: '#ef4444',
    },
    errorContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: 12,
      padding: 12,
      marginBottom: 16,
      gap: 8,
    },
    errorText: {
      flex: 1,
      fontSize: 14,
      color: '#ef4444',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    submitButton: {
      backgroundColor: '#22c55e',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      marginBottom: 16,
    },
    submitButtonDisabled: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
  });

import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  DevSettings,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../contexts/I18nContext';
import { deleteAllUserData } from '../utils/auth/deleteUserData';
import { networkManager } from '../utils/network/networkManager';

interface DeleteDataModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DeleteDataModal({ visible, onClose }: DeleteDataModalProps) {
  const { isRTL, t } = useI18n();
  const insets = useSafeAreaInsets();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [error, setError] = useState('');

  const styles = createStyles(isRTL);

  const handleClose = () => {
    if (!isDeleting) {
      setIsConfirmed(false);
      setError('');
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!isConfirmed || isDeleting) return;

    // Clear previous errors
    setError('');

    // Check network connectivity
    if (!networkManager.isOnline()) {
      setError(t('deleteDataRequiresInternet'));
      return;
    }

    setIsDeleting(true);

    try {
      await deleteAllUserData();
      setIsConfirmed(false);
      setError('');
      setIsDeleting(false);

      // Show restarting state before reload
      setIsRestarting(true);

      // Delay to show the restarting message before reload
      // Note: There may still be a brief white flash during the actual reload in dev mode
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Reload the app
      if (__DEV__) {
        if (DevSettings?.reload) {
          DevSettings.reload();
        }
      } else {
        await Updates.reloadAsync();
      }
    } catch (err) {
      console.error('Delete data error:', err);
      setError(t('deleteDataError'));
      setIsDeleting(false);
    }
  };

  // Show full-screen restarting view
  if (isRestarting) {
    return (
      <Modal visible={visible} animationType="fade" transparent={false}>
        <View style={styles.restartingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.restartingText}>{t('restartingApp')}</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
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
            <Text style={styles.title}>{t('deleteDataTitle')}</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isDeleting}
            >
              <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          {/* Warning Icon */}
          <View style={styles.warningIconContainer}>
            <View style={styles.warningIconCircle}>
              <Ionicons name="warning" size={40} color="#ef4444" />
            </View>
          </View>

          {/* Warning Text */}
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningText}>{t('deleteDataWarning')}</Text>
            <Text style={styles.irreversibleText}>
              {t('deleteDataIrreversible')}
            </Text>
          </View>

          {/* Confirmation Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsConfirmed(!isConfirmed)}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            <View
              style={[styles.checkbox, isConfirmed && styles.checkboxChecked]}
            >
              {isConfirmed && (
                <Ionicons name="checkmark" size={16} color="#ffffff" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              {t('deleteDataConfirmCheckbox')}
            </Text>
          </TouchableOpacity>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deleteButton,
                (!isConfirmed || isDeleting) && styles.deleteButtonDisabled,
              ]}
              onPress={handleDelete}
              disabled={!isConfirmed || isDeleting}
              activeOpacity={0.7}
            >
              {isDeleting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.deleteButtonText}>
                  {t('deleteDataButton')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (isRTL: boolean) =>
  StyleSheet.create({
    restartingContainer: {
      flex: 1,
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
    },
    restartingText: {
      fontSize: 18,
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
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
      color: '#ef4444',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    closeButton: {
      padding: 4,
    },
    warningIconContainer: {
      alignItems: 'center',
      marginBottom: 16,
    },
    warningIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    warningTextContainer: {
      marginBottom: 20,
    },
    warningText: {
      fontSize: 15,
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 12,
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
    },
    irreversibleText: {
      fontSize: 14,
      color: '#ef4444',
      textAlign: 'center',
      fontWeight: '600',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    checkboxContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: isRTL ? 0 : 12,
      marginLeft: isRTL ? 12 : 0,
    },
    checkboxChecked: {
      backgroundColor: '#ef4444',
      borderColor: '#ef4444',
    },
    checkboxLabel: {
      flex: 1,
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
      textAlign: isRTL ? 'right' : 'left',
      fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
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
    buttonContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      gap: 12,
      marginBottom: 16,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
    deleteButton: {
      flex: 1,
      backgroundColor: '#ef4444',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
    },
    deleteButtonDisabled: {
      backgroundColor: 'rgba(239, 68, 68, 0.3)',
      opacity: 0.5,
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
    },
  });

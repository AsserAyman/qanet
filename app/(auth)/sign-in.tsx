import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const { t, isRTL } = useI18n();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme, isRTL);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/1774859/pexels-photo-1774859.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
        <Text style={styles.headerTitle}>{t('nightPrayerTracker')}</Text>
        <Text style={styles.headerSubtitle}>{t('trackYourNightlyPrayers')}</Text>
      </View>

      <View style={styles.card}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('enterYourEmail')}
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={t('enterYourPassword')}
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? t('signingIn') : t('signIn')}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.buttonOutline, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}>
          <Text style={[styles.buttonText, styles.buttonTextOutline]}>
            {loading ? t('creatingAccount') : t('createAccount')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: any, isRTL: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    height: 240,
    justifyContent: 'flex-end',
    padding: 24,
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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Bold' : undefined,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 16,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  card: {
    flex: 1,
    backgroundColor: theme.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  errorContainer: {
    backgroundColor: theme.error + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.textSecondary,
    marginBottom: 6,
    textAlign: isRTL ? 'right' : 'left',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  input: {
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.primary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
  buttonTextOutline: {
    color: theme.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  dividerText: {
    color: theme.textSecondary,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: isRTL ? 'NotoNaskhArabic-Regular' : undefined,
  },
});
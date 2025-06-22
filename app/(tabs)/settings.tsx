import { Feather, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { supabase } from '../../utils/supabase';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const router = useRouter();

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{
            uri: 'https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>
            Customize your app experience
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Theme Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.themeOptions}>
            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'light' && styles.themeOptionActive,
              ]}
              onPress={() => handleThemeChange('light')}
            >
              <Feather 
                name="sun" 
                size={20} 
                color={themeMode === 'light' ? theme.primary : theme.textSecondary} 
              />
              <Text style={[
                styles.themeOptionText,
                themeMode === 'light' && styles.themeOptionTextActive,
              ]}>
                Light
              </Text>
              {themeMode === 'light' && (
                <Feather name="check" size={16} color={theme.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'dark' && styles.themeOptionActive,
              ]}
              onPress={() => handleThemeChange('dark')}
            >
              <Feather 
                name="moon" 
                size={20} 
                color={themeMode === 'dark' ? theme.primary : theme.textSecondary} 
              />
              <Text style={[
                styles.themeOptionText,
                themeMode === 'dark' && styles.themeOptionTextActive,
              ]}>
                Dark
              </Text>
              {themeMode === 'dark' && (
                <Feather name="check" size={16} color={theme.primary} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOption,
                themeMode === 'system' && styles.themeOptionActive,
              ]}
              onPress={() => handleThemeChange('system')}
            >
              <Feather 
                name="smartphone" 
                size={20} 
                color={themeMode === 'system' ? theme.primary : theme.textSecondary} 
              />
              <Text style={[
                styles.themeOptionText,
                themeMode === 'system' && styles.themeOptionTextActive,
              ]}>
                System
              </Text>
              {themeMode === 'system' && (
                <Feather name="check" size={16} color={theme.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Prayer Status Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Prayer Status Levels</Text>
          
          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusIconContainer,
                { backgroundColor: theme.error + '20' },
              ]}
            >
              <MaterialIcons name="warning" size={24} color={theme.error} />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Negligent</Text>
              <Text style={styles.statusSubtitle}>Less than 10 verses</Text>
              <Text style={styles.statusDescription}>
                Strive to read at least 10 verses to avoid being recorded among
                the negligent.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusIconContainer,
                { backgroundColor: theme.warning + '20' },
              ]}
            >
              <Feather name="moon" size={24} color={theme.warning} />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Not Negligent</Text>
              <Text style={styles.statusSubtitle}>10-99 verses</Text>
              <Text style={styles.statusDescription}>
                Reading 10 or more verses keeps you from being recorded among
                the negligent.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusIconContainer,
                { backgroundColor: theme.primary + '20' },
              ]}
            >
              <MaterialIcons name="military-tech" size={24} color={theme.primary} />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Qanet</Text>
              <Text style={styles.statusSubtitle}>100-999 verses</Text>
              <Text style={styles.statusDescription}>
                Reading 100 verses records you among those who are obedient to
                Allah.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusIconContainer,
                { backgroundColor: theme.success + '20' },
              ]}
            >
              <MaterialIcons name="military-tech" size={24} color={theme.success} />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Mokantar</Text>
              <Text style={styles.statusSubtitle}>1000+ verses</Text>
              <Text style={styles.statusDescription}>
                Reading 1000 verses earns you huge rewards.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.hadithCard}>
          <Text style={styles.hadithTitle}>Hadith</Text>
          <Text style={styles.hadithText}>
            The Prophet (ﷺ) said: "If anyone prays at night reciting regularly
            ten verses, he will not be recorded among the negligent; if anyone
            prays at night and recites a hundred verses, he will be recorded
            among those who are obedient to Allah (Qanet); and if anyone prays
            at night reciting one thousand verses, he will be recorded among
            those who receive huge rewards."
          </Text>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Feather name="log-out" size={20} color={theme.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  themeOptions: {
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  themeOptionActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primary + '10',
  },
  themeOptionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  themeOptionTextActive: {
    color: theme.primary,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  hadithCard: {
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
  hadithTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  hadithText: {
    fontSize: 16,
    color: theme.text,
    lineHeight: 24,
    fontFamily: 'NotoNaskhArabic-Regular',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.error + '30',
    gap: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.error,
  },
});
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Moon, Award, TriangleAlert as AlertTriangle } from 'lucide-react-native';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/1624438/pexels-photo-1624438.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>About Night Prayer</Text>
          <Text style={styles.headerSubtitle}>Understanding prayer status levels</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.statusItem}>
            <View style={[styles.statusIconContainer, { backgroundColor: '#fef2f2' }]}>
              <AlertTriangle size={24} color="#dc2626" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Negligent</Text>
              <Text style={styles.statusSubtitle}>Less than 10 verses</Text>
              <Text style={styles.statusDescription}>
                Strive to read at least 10 verses to avoid being recorded among the negligent.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View style={[styles.statusIconContainer, { backgroundColor: '#fef9c3' }]}>
              <Moon size={24} color="#ca8a04" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Not Negligent</Text>
              <Text style={styles.statusSubtitle}>10-99 verses</Text>
              <Text style={styles.statusDescription}>
                Reading 10 or more verses keeps you from being recorded among the negligent.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View style={[styles.statusIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Award size={24} color="#2563eb" />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Qanet</Text>
              <Text style={styles.statusSubtitle}>100-999 verses</Text>
              <Text style={styles.statusDescription}>
                Reading 100 verses records you among those who are obedient to Allah.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusItem}>
            <View style={[styles.statusIconContainer, { backgroundColor: '#dcfce7' }]}>
              <Award size={24} color="#15803d" />
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
            The Prophet (ﷺ) said: "If anyone prays at night reciting regularly ten verses, he will not be recorded among the negligent; if anyone prays at night and recites a hundred verses, he will be recorded among those who are obedient to Allah (Qanet); and if anyone prays at night reciting one thousand verses, he will be recorded among those who receive huge rewards."
          </Text>
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
    color: '#1e293b',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  hadithCard: {
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
  hadithTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  hadithText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
    fontFamily: 'NotoNaskhArabic-Regular',
  },
});
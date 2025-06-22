import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { getPrayerLogs, getStatusStats, getCurrentStreak, getYearlyData, getMonthlyData, PrayerLog } from '../../utils/supabase';
import { Award, Flame, Moon, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Calendar } from '../../components/Calendar';
import { YearlyGraph } from '../../components/YearlyGraph';

export default function HistoryScreen() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<PrayerLog[]>([]);
  const [stats, setStats] = useState<{ status: string; count: number }[]>([]);
  const [streak, setStreak] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [yearlyData, setYearlyData] = useState<{ [key: string]: number }>({});
  const [monthlyData, setMonthlyData] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!session) {
      router.replace('/(auth)/sign-in');
      return;
    }

    async function loadData() {
      try {
        const [logsData, statsData, streakData, yearData, monthData] = await Promise.all([
          getPrayerLogs(),
          getStatusStats(),
          getCurrentStreak(),
          getYearlyData(),
          getMonthlyData()
        ]);
        setLogs(logsData);
        setStats(statsData);
        setStreak(streakData);
        setYearlyData(yearData);
        setMonthlyData(monthData);
      } catch (err: any) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [session, authLoading]);

  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Prayer History</Text>
          <Text style={styles.headerSubtitle}>Track your progress and consistency</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.streakCard}>
          <View style={styles.streakIconContainer}>
            <Flame size={32} color="#dc2626" />
          </View>
          <View style={styles.streakContent}>
            <Text style={styles.streakTitle}>Current Streak</Text>
            <Text style={styles.streakCount}>{streak} days</Text>
          </View>
        </View>

        <Calendar
          date={selectedDate}
          markedDates={monthlyData}
          onDateChange={setSelectedDate}
        />

        <YearlyGraph data={yearlyData} />

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Prayer Status Distribution</Text>
          {stats.map((stat) => (
            <View key={stat.status} style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: getStatusColor(stat.status) + '10' }]}>
                <Award size={24} color={getStatusColor(stat.status)} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statTitle}>{stat.status}</Text>
                <Text style={styles.statCount}>{stat.count} days</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </View>
          ))}
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Recent History</Text>
          {logs.map((log) => (
            <View key={log.id} style={styles.historyItem}>
              <View style={[styles.historyIconContainer, { backgroundColor: getStatusColor(log.status) + '10' }]}>
                <Moon size={20} color={getStatusColor(log.status)} />
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyDate}>{new Date(log.date).toLocaleDateString()}</Text>
                <Text style={styles.historyRange}>
                  {log.start_surah} {log.start_ayah} → {log.end_surah} {log.end_ayah}
                </Text>
                <Text style={styles.historyVerses}>{log.total_ayahs} verses</Text>
              </View>
              <Text style={[styles.historyStatus, { color: getStatusColor(log.status) }]}>
                {log.status}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Mokantar':
      return '#15803d';
    case 'Qanet':
      return '#2563eb';
    case 'Not Negligent':
      return '#ca8a04';
    default:
      return '#dc2626';
  }
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
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 20,
  },
  streakCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  streakIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  streakContent: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statsCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 2,
  },
  statCount: {
    fontSize: 14,
    color: '#64748b',
  },
  historyCard: {
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
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  historyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  historyRange: {
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 2,
  },
  historyVerses: {
    fontSize: 14,
    color: '#64748b',
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
});